
create procedure dbo.sp_ReplicationAddDropped

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
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
/* End top of each procedure to capture parameters */

-- this proc is called by the PACS upgrade process.
-- if replication has been dropped for a table during an upgrade
-- a table called replication_subscription_dropped
-- will have info on tables needing replication rebuilt
-- this proc will loop through this table and attempt to 
-- add the publications and subscriptions back that were dropped
 
declare @ret int

declare @loop_counter int
declare @min_id int
declare @rep_tables table(Id int identity(1,1),
                          szTableName sysname,
                          pub_prefix varchar(20) )

declare @szDestServer sysname
declare @szDestDB sysname
declare @szPubName sysname
declare @subscription_counter int
declare @min_subscription_id int
declare @subscriptions table(Id int identity(1,1),
                             szDestServer sysname,
                             szDestDB sysname)

-- get unique table names to add publication for
insert into @rep_tables(szTableName,pub_prefix)
 select distinct szTableName,publication_prefix
   from dbo.replication_subscription_dropped 

set @loop_counter = @@ROWCOUNT

set @loop_counter = coalesce(@loop_counter,0)

declare @szTableName sysname
declare @pub_prefix varchar(20)

while @loop_counter > 0
begin
    set  @min_id = (select min(Id) from @rep_tables)

	select @szTableName = szTableName,
           @pub_prefix = pub_prefix
	  from @rep_tables 
     where Id = @min_id 

 
    exec @ret = dbo.sp_PACS_AddTablePublication @szTableName , @pub_prefix

	if @ret <> 0 
		begin
          set @qry = 'Error creating publication on table ' + @szTableName
          exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR
		  RAISERROR('sp_ReplicationAddDropped Error: Unable to add publication back for table: %s' , 16, 1,@szTableName) WITH NOWAIT
		  return -1
	   end
    else  -- log success
        begin
          set @qry = 'Created publication on table ' + @szTableName
          exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR
        end 

    -- add subscriptions
    insert into @subscriptions(szDestServer,szDestDB)
     select distinct szDestServer, szDestDB
	   from dbo.replication_subscription_dropped
	  where szTableName = @szTableName
        and publication_prefix = @pub_prefix
  
    set @subscription_counter = @@ROWCOUNT
    set @subscription_counter = coalesce(@subscription_counter,0)


    while @subscription_counter > 0
       begin

         set  @min_subscription_id = (select min(Id) from @subscriptions)

	     select @szDestServer = szDestServer,
                @szDestDB = szDestDB
	       from @subscriptions where Id = @min_subscription_id

         set @szPubName = @pub_prefix + @szTableName

         exec @ret = dbo.sp_PACS_AddTableSubscription
                         @szPubName,
                         @szDestServer,
                         @szDestDB 

	     if @ret <> 0 
	    	begin
                set @qry = 'Error creating subscription on table '
                    + @szTableName + ' for Dest Server ' + @szDestServer
                    + ' Dest database ' + @szDestDB
                exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

	        	RAISERROR('sp_ReplicationAddDropped Error: Unable to add subscription back for table: %s' , 16, 1,@szTableName) WITH NOWAIT
		        return -1
	        end     

         -- clear this entry from the subscription looping table
         delete from @subscriptions where Id = @min_subscription_id

         -- decrement counter to end while loop
         set @subscription_counter = @subscription_counter - 1

       end   --  while @subscription_counter > 0  end

    -- now clear this entry from looping table
    delete from @rep_tables where id = @min_id 
    delete from @subscriptions
    -- remove entries for this table from the upgrade dropped subscription table
	delete dbo.replication_subscription_dropped
	 where szTableName = @szTableName
       and publication_prefix = @pub_prefix

    -- decrement counter to end while loop
	set @loop_counter = @loop_counter - 1

    -- start snapshot agent
    print 'Starting snapshot for publication: ' + @szPubName
    exec dbo.sp_PACS_StartSnapshotAgent @szPubName


    -- log success
    set @qry = 'Replication successfully restored for table: ' + @szTableName 
    exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

    RAISERROR('sp_ReplicationAddDropped Info: Replication successfully restored for table: %s' , 0, 1,@szTableName) WITH NOWAIT



end  -- while @loop_counter > 0 end

GO

