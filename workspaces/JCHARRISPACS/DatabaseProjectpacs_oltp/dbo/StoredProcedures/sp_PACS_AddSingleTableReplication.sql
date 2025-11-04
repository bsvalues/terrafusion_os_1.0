
create procedure dbo.sp_PACS_AddSingleTableReplication
    @szTableName sysname,
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
 + ' @szTableName =' + @szTableName + ','
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
declare @bDSS bit
declare @bWEB bit
    set @bDSS = 0
    set @bWEB = 0

if @lReplicationType is null
   begin
	 set @bDSS = 1
	 set @bWEB = 1
   end  
else
	if @lReplicationType = 0
	   begin
		 set @bDSS = 1
	   end
	else
	   if @lReplicationType = 1 
		   begin
			 set @bWEB = 1
		   end  
	   else 
		   begin
            exec dbo.CurrentActivityLogInsert @proc, 'Error: @lReplicationType value is invalid',@@ROWCOUNT,@@ERROR
			RAISERROR('sp_PACS_AddSingleTableReplication Error: @lReplicationType value is invalid: %i' , 16, 1,@lReplicationType) WITH NOWAIT
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


-- create publications and subscriptions
declare @ret int
declare @pub_prefix varchar(20)
    set @pub_prefix = 'table_pacs_'
declare @szPubName sysname
    set @szPubName = @pub_prefix + @szTableName


exec @ret = dbo.sp_PACS_AddTablePublication @szTableName , @pub_prefix

if @ret <> 0 
	begin
    exec dbo.CurrentActivityLogInsert @proc, 'Error: Unable to add publication for table',@@ROWCOUNT,@@ERROR

	RAISERROR('sp_PACS_AddSingleTableReplication Error: Unable to add publication for table: %s' , 16, 1,@szTableName) WITH NOWAIT
	return -1
   end

-- add subscriptions



if @bDSS = 1
   begin
     exec @ret = dbo.sp_PACS_AddTableSubscription
                     @szPubName,
                     @szServerNameDest_DSS,
                     @szServerDBDest_DSS  

     if @ret <> 0 
    	begin
            exec dbo.CurrentActivityLogInsert @proc, 'Error: Unable to add DSS subscription for table',@@ROWCOUNT,@@ERROR
        	RAISERROR('sp_PACS_AddSingleTableReplication Error: Unable to add subscription for table: %s on DSS server %s database %s.' , 16, 1,@szTableName,@szServerNameDest_DSS,@szServerDBDest_DSS) WITH NOWAIT
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
            exec dbo.CurrentActivityLogInsert @proc, 'Error: Unable to add WEB subscription for table',@@ROWCOUNT,@@ERROR
        	RAISERROR('sp_PACS_AddSingleTableReplication Error: Unable to add subscription for table: %s on WEB server %s database %s.' , 16, 1,@szTableName,@szServerNameDest_WEB,@szServerDBDest_WEB) WITH NOWAIT
	        return -1
        end     
   end 

-- start snapshot agent
print 'Starting snapshot for publication: ' + @szPubName
exec dbo.sp_PACS_StartSnapshotAgent @szPubName

-- show success message for table
exec dbo.CurrentActivityLogInsert @proc, 'Info: Replication successfully created',@@ROWCOUNT,@@ERROR

RAISERROR('sp_PACS_AddSingleTableReplication Info: Replication successfully created for table: %s' , 0, 1,@szTableName) WITH NOWAIT


-- show final success message
RAISERROR('sp_PACS_AddSingleTableReplication Info: Success' , 0, 1) WITH NOWAIT

GO

