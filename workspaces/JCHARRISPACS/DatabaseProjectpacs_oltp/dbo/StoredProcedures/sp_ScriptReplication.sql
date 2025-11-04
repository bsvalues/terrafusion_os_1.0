
create procedure dbo.sp_ScriptReplication
	@szServerNameSource sysname,
	@szServerDBSource sysname,

	@szServerNameDest_DSS sysname,
	@szServerDBDest_DSS sysname,
	@szServerNameDest_WEB sysname,
	@szServerDBDest_WEB sysname,

	@lReplicationType int
	/*
		Accepted values for @lReplicationType:
			0		DSS Replication
			1		Web Replication
			null	Both
	*/
   
as
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows int
DECLARE @LogStatus varchar(200)
DECLARE @LogErrCode int
DECLARE @qry varchar(1000)
 declare @proc varchar(100)
 set @proc = object_name(@@procid)
 
 SET @qry = 'Start - ' + @proc  
 + ' @szServerNameSource =' + @szServerNameSource + ','
 + ' @szServerDBSource =' + @szServerDBSource + ','
 + ' @szServerNameDest_DSS =' + @szServerNameDest_DSS + ','
 + ' @szServerDBDest_DSS =' + @szServerDBDest_DSS + ','
 + ' @szServerNameDest_WEB =' + @szServerNameDest_WEB + ','
 + ' @szServerDBDest_WEB =' + @szServerDBDest_WEB + ','
 + ' @lReplicationType =' +  ISNULL(convert(varchar(30),@lReplicationType),'NULL') 
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
/* End top of each procedure to capture parameters */

-- verify @lReplicationType has a valid value
declare @type int
if @lReplicationType = 0 or @lReplicationType = 1 or @lReplicationType is null
   set @type = 1 
else
   begin
    exec dbo.CurrentActivityLogInsert @proc, 'Error: @lReplicationType value is invalid',@@ROWCOUNT,@@ERROR
	RAISERROR('sp_ScriptReplication Error: @lReplicationType value is invalid: %i' , 16, 1,@lReplicationType) WITH NOWAIT
	return -1
   end

-- 
exec sp_replicationdboption @dbname = @szServerDBSource,
         @optname = N'publish', @value = N'true'

-- determine sql server version, different syntax for versions is required
DECLARE @ver varchar(7)
SELECT @ver = CASE
 WHEN CHARINDEX('9.00', @@VERSION) > 0 THEN '2005'
 WHEN CHARINDEX('8.00', @@VERSION) > 0 THEN '2000'
 ELSE '2005' -- no clients are lower than 2000, default to 2005
END 

-- get distributor server name
declare @szDistributorServer varchar(255)
exec sp_helpdistributor @distributor = @szDistributorServer OUTPUT
if len(isnull(@szDistributorServer,'')) = 0
   begin
    exec dbo.CurrentActivityLogInsert @proc, 'Error: Unable to determine distributor server name',@@ROWCOUNT,@@ERROR
    RAISERROR('Unable to determine distributor server name.' , 16, 1) WITH NOWAIT
    return -1
   end

if @ver = '2005'
   begin
-- see if logreader agent job already exists for SQL 2005 and above
	declare @logreaderjob varchar(200)
	declare @sql varchar(1000)

	create table #logreader(logreaderjob varchar(200))

	set @sql = 'insert into #logreader(logreaderjob) '
		 + 'select [name] from [' + @szDistributorServer + '].distribution.dbo.MSlogreader_agents '
		 + 'where publisher_db = ''' + db_name(db_id()) + ''''

	exec (@sql)

	select @logreaderjob = (select logreaderjob from #logreader)

	if len(isnull(@logreaderjob,'')) = 0
	   begin
         set @sql = 'exec sys.sp_addlogreader_agent'
		 exec (@sql)
	   end

end

-- now create table to hold info for tables need replicating (DSS/Web or both)

declare @rep_tables table (Id int identity(1,1),szTableName sysname,bDSS bit,bWeb bit)

insert into @rep_tables(szTableName,bDSS,bWeb)
  select szTableName,
		 bDSS = convert(bit, case when lDSSReplicationFlag = 1 then 1 else 0 end),
		 bWeb = convert(bit, case when lWebReplicationFlag = 1 then 1 else 0 end)
	from pacs_tables 
    where (lDSSReplicationFlag = 1 or lWebReplicationFlag = 1)
  order by szTableName

if @lReplicationType = 0  -- DSS Only
   begin 
      delete from @rep_tables where bDSS <> 1
      update @rep_tables set bWeb = 0
   end

if @lReplicationType = 1  -- Web Only
   begin 
      delete from @rep_tables where bWeb <> 1
      update @rep_tables set bDSS = 0
   end

-- now loop through entries to set up publications and subscriptions
declare @ret int

declare @loop_counter int
declare @min_id int

set @loop_counter = (select count(*) from @rep_tables)

set @loop_counter = coalesce(@loop_counter,0)

declare @szTableName sysname
declare @bDSS int
declare @bWeb int
declare @szPubName sysname
declare @publication_prefix varchar(20)
select @publication_prefix = (select publication_prefix
                                from dbo.pacs_supported_replication_publication_prefix
                               where publication_type = 'pacs' )

while @loop_counter > 0
begin
    set  @min_id = (select min(Id) from @rep_tables)

	select @szTableName = szTableName,
           @bDSS = bDSS,
           @bWeb = bWeb
	  from @rep_tables 
     where Id = @min_id 

    exec @ret = dbo.sp_PACS_AddTablePublication @szTableName ,@publication_prefix

	if @ret <> 0 
		begin
		RAISERROR('sp_ScriptReplication Error: Unable to add publication for table: %s' , 16, 1,@szTableName) WITH NOWAIT
		return -1
	   end

    -- add subscriptions

    set @szPubName = 'table_pacs_' + @szTableName

    if @bDSS = 1
       begin
         exec @ret = dbo.sp_PACS_AddTableSubscription
                         @szPubName,
                         @szServerNameDest_DSS,
                         @szServerDBDest_DSS  

	     if @ret <> 0 
	    	begin
	        	RAISERROR('sp_ScriptReplication Error: Unable to add subscription for table: %s on DSS server %s database %s.' , 16, 1,@szTableName,@szServerNameDest_DSS,@szServerDBDest_DSS) WITH NOWAIT
		        return -1
	        end     
       end 

    if @bWeb = 1
       begin
         exec @ret = dbo.sp_PACS_AddTableSubscription
                         @szPubName,
                         @szServerNameDest_WEB,
                         @szServerDBDest_WEB  

	     if @ret <> 0 
	    	begin
	        	RAISERROR('sp_ScriptReplication Error: Unable to add subscription for table: %s on WEB server %s database %s.' , 16, 1,@szTableName,@szServerNameDest_WEB,@szServerDBDest_WEB) WITH NOWAIT
		        return -1
	        end     
       end 

    -- now clear this entry from looping table
    delete from @rep_tables where id = @min_id 

     -- decrement counter to end while loop
	set @loop_counter = @loop_counter - 1

    RAISERROR('sp_ScriptReplication Info: Replication successfully created for table: %s' , 0, 1,@szTableName) WITH NOWAIT

end  -- while @loop_counter > 0 end

-- show final success message
exec dbo.CurrentActivityLogInsert @proc, 'Info: Replication successfully created',@@ROWCOUNT,@@ERROR

RAISERROR('sp_ScriptReplication Info: Success' , 0, 1) WITH NOWAIT

GO

