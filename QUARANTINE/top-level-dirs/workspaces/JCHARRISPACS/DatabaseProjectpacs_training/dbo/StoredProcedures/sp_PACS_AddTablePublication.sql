CREATE PROCEDURE dbo.sp_PACS_AddTablePublication
     @szTable sysname,
     @publication_prefix varchar(20)
AS

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
 + ' @szTable =' + @szTable
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
 
/* End top of each procedure to capture parameters */

-- determine sql server version, different syntax for versions is required
DECLARE @ver varchar(7)
SELECT @ver = CASE
 WHEN CHARINDEX('9.00', @@VERSION) > 0 THEN '2005'
 WHEN CHARINDEX('8.00', @@VERSION) > 0 THEN '2000'
 ELSE '2005' -- no clients are lower than 2000, default to 2005
END 

-- check for table existence
if not exists (
	select *
	from sysobjects
	where name = @szTable
      and xtype = 'U'
)
begin
    exec dbo.CurrentActivityLogInsert @proc, 'Info: Table does not exists in this database',@@ROWCOUNT,@@ERROR
    RAISERROR('sp_PACS_AddTablePublication Info: Table %s does not exists in this database.' , 0, 1,@szTable) WITH NOWAIT
    return -1
end

-- table has to have a primary key for replication to work, check for it
if not exists(select t.table_name
                from information_schema.tables t 
                join INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
	              on t.table_name = tc.table_name 
               where tc.constraint_type = 'primary key' 
                 and t.table_name = @szTable)
begin
    exec dbo.CurrentActivityLogInsert @proc, 'Info: Table does not have a Primary Key which is required for replication',@@ROWCOUNT,@@ERROR
    RAISERROR('sp_PACS_AddTablePublication Info: Table %s does not have a Primary Key which is required for replication.' , 0, 1,@szTable) WITH NOWAIT
    return -1
end

declare @szPubName sysname
set @szPubName = @publication_prefix + @szTable

declare @svrName varchar(1000)
    set @svrName = @@SERVERNAME
declare @dbName sysname
    set @dbName = db_name(db_id())

if object_id('syspublications') is null
 begin
    exec dbo.CurrentActivityLogInsert @proc, 'Error: Database is not marked for publication',@@ROWCOUNT,@@ERROR
    RAISERROR('sp_PACS_AddTablePublication Info: Database %s on server %s is not marked for publication - does not have syspublications table.' , 0, 1,@dbName,@svrName) WITH NOWAIT
    return -1
end

if exists (
	select *
	from syspublications
	where name = @szPubName
)
begin
    exec dbo.CurrentActivityLogInsert @proc, 'Info: Publication already exists',@@ROWCOUNT,@@ERROR
    RAISERROR('sp_PACS_AddTablePublication Info: Publication %s already exists.' , 0, 1,@szPubName) WITH NOWAIT
    return 0
end

declare @sql nvarchar(3000)  -- needs to be nvarchar for sp_executesql

-- get distributor server name
declare @szDistServer varchar(255)
exec sp_helpdistributor @distributor = @szDistServer OUTPUT
if len(isnull(@szDistServer,'')) = 0
   begin
    exec dbo.CurrentActivityLogInsert @proc, 'Error: Unable to determine distributor server name',@@ROWCOUNT,@@ERROR
    RAISERROR('sp_PACS_AddTablePublication Error: Unable to determine distributor server name to drop replication for Table: %s' , 16, 1,@szTable) WITH NOWAIT
    return -1
   end

-- 
DECLARE @CRLF VARCHAR(2)
    SET @CRLF = CHAR(13) + CHAR(10) -- to help format dynamic sql for debugging

declare @ret int  -- for return value from called procedures

-- now build sql for adding publication

set @sql =
'exec @ret = sp_addpublication '  + @CRLF
+ '	 @publication = N''' + @szPubName + ''', '  + @CRLF
+ '	 @sync_method = N''concurrent'', '  + @CRLF
+ '	 @repl_freq = N''continuous'', '  + @CRLF
+ '	 @description = N''' + @szPubName + ''', '  + @CRLF
+ '	 @status = N''active'', '  + @CRLF
+ '	 @allow_push = N''true'', '  + @CRLF
+ '	 @allow_pull = N''true'', '  + @CRLF
+ '	 @allow_anonymous = N''false'', '  + @CRLF
+ '	 @enabled_for_internet = N''false'', '  + @CRLF
+ '	 @independent_agent = N''false'', '  + @CRLF
+ '	 @immediate_sync = N''false'', '  + @CRLF
+ '	 @allow_sync_tran = N''false'', '  + @CRLF
+ '	 @autogen_sync_procs = N''false'', '  + @CRLF
+ '	 @retention = 336, '  + @CRLF
+ '	 @allow_queued_tran = N''false'', '  + @CRLF
+ '	 @snapshot_in_defaultfolder = N''true'', '  + @CRLF
+ '	 @compress_snapshot = N''false'', '  + @CRLF
+ '	 @ftp_port = 21, '  + @CRLF
+ '	 @ftp_login = N''anonymous'', '  + @CRLF
+ '	 @allow_dts = N''false'', '  + @CRLF
+ '	 @allow_subscription_copy = N''false'', '  + @CRLF
+ '	 @add_to_active_directory = N''false'' '  + @CRLF

if @ver = 2005
   begin
		set @sql = @sql
		+ '	 ,@replicate_ddl = 1  '  + @CRLF 
   end

--print @sql

exec sp_executesql 
     @sql,
     N'@ret INT OUT',@ret OUT
     
if @ret <> 0
   begin
     exec dbo.CurrentActivityLogInsert @proc, 'Error: Error creating publication',@@ROWCOUNT,@@ERROR
	 RAISERROR('sp_PACS_AddTablePublication Error: Error creating publication %s for Table: %s' , 16, 1,@szPubName,@szTable) WITH NOWAIT
	 return -1
   end  

exec @ret = sp_addpublication_snapshot 
	@publication = @szPubName,
	@frequency_type = 1,
	@frequency_interval = 1,
	@frequency_relative_interval = 1,
	@frequency_recurrence_factor = 0,
	@frequency_subday = 8,
	@frequency_subday_interval = 1,
	@active_start_date = 0,
	@active_end_date = 0,
	@active_start_time_of_day = 0,
	@active_end_time_of_day = 235959

if @ret <> 0
   begin
     -- need to delete publication created in prior step
     exec @ret =  sp_droppublication
		          @publication = @szPubName

     exec dbo.CurrentActivityLogInsert @proc, 'Error: Error creating snapshot agent on publication',@@ROWCOUNT,@@ERROR
	 RAISERROR('sp_PACS_AddTablePublication Error: Error creating snapshot agent on publication %s for Table: %s' , 16, 1,@szPubName,@szTable) WITH NOWAIT
	 return -1
   end  

-- disable the snapshot agent job
declare @uuidJob uniqueidentifier

select @uuidJob = convert(uniqueidentifier, snapshot_jobid)
  from syspublications
 where name = @szPubName

set @sql = 'exec @ret = [' + @szDistServer + '].msdb.dbo.sp_update_job '
         + ' @job_id = ''' + convert(varchar(50),@uuidJob) +  ''', @enabled = 0 '

--print @sql

exec sp_executesql @sql,N'@ret int OUT', @ret OUT

if @ret <> 0
   begin
     -- need to delete publication created in prior step
     exec @ret =  sp_droppublication
		          @publication = @szPubName

     exec dbo.CurrentActivityLogInsert @proc, 'Error: Error disabling snapshot agent',@@ROWCOUNT,@@ERROR
	 RAISERROR('sp_PACS_AddTablePublication Error: Error disabling the snapshot agent for Table: %s' , 16, 1,@szTable) WITH NOWAIT
	 return -1
   end  


declare
	@szCmdINS sysname,
	@szCmdDEL sysname,
	@szCmdUPD sysname
set @szCmdINS = 'CALL sp_MSins_' + @szTable
set @szCmdDEL = 'CALL sp_MSdel_' + @szTable
set @szCmdUPD = 'CALL sp_MSupd_' + @szTable

set @sql = 
+ 'exec @ret = sp_addarticle  '  + @CRLF
+ '	 @publication = N''' + @szPubName + ''', '  + @CRLF
+ '	 @article = N''' + @szTable + ''', '  + @CRLF
+ '	 @source_owner = N''dbo'', '  + @CRLF
+ '	 @source_object = N''' + @szTable + ''', '  + @CRLF
+ '	 @destination_table = N''' + @szTable + ''', '  + @CRLF
+ '	 @type = N''logbased'', '  + @CRLF
+ '	 @creation_script = null, '  + @CRLF
+ '	 @description = null, '  + @CRLF
+ '	 @pre_creation_cmd = N''drop'', '  + @CRLF
+ '	 @schema_option = 0x00000000000000F3, '  + @CRLF
+ '	 @status = 16, '  + @CRLF
+ '	 @vertical_partition = N''false'', '  + @CRLF
+ '	 @ins_cmd = N''' + @szCmdINS + ''', '  + @CRLF
+ '	 @del_cmd = N''' + @szCmdDEL + ''', '  + @CRLF
+ '	 @upd_cmd = N''' + @szCmdUPD + ''', '  + @CRLF
+ '	 @filter = null, '  + @CRLF
+ '	 @sync_object = null  '  + @CRLF

if @ver = 2005
   begin
		set @sql = @sql
		+ '	 ,@identityrangemanagementoption = N''manual'' '  + @CRLF
   end

if @ver = 2000
   begin
		set @sql = @sql
		+ '	 ,@auto_identity_range = N''false'' '  + @CRLF
   end

--print @sql

exec sp_executesql 
     @sql,
     N'@ret INT OUT',@ret OUT


if @ret <> 0
   begin
     -- need to delete publication created in prior step
     exec @ret =  sp_droppublication
		          @publication = @szPubName
	 RAISERROR('sp_PACS_AddTablePublication Error: Error removing the publication for Table: %s' , 16, 1,@szTable) WITH NOWAIT
	 return -1
   end  

-- subscriptions should be added through the stored proc
-- sp_PACS_AddTableSubscription

GO

