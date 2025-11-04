
create procedure dbo.sp_PACS_StartSnapshotAgent
   @szPubName sysname
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
 + ' @szPubName =' + @szPubName 
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
/* End top of each procedure to capture parameters */
 

declare @sql nvarchar(1000)
declare @ret int

-- get distributor server name
declare @szDistServer varchar(255)
exec sp_helpdistributor @distributor = @szDistServer OUTPUT
if len(isnull(@szDistServer,'')) = 0
   begin
	exec dbo.CurrentActivityLogInsert @proc, 'Error: Unable to determine distributor server name',@@ROWCOUNT,@@ERROR
	RAISERROR('sp_PACS_StartSnapshotAgent Error: Unable to determine distributor server name to start snapshot agent for publication: %s' , 16, 1,@szPubName) WITH NOWAIT
	RETURN -1
   end

-- find job info

declare @uuidJob uniqueidentifier

select @uuidJob = convert(uniqueidentifier, snapshot_jobid)
  from syspublications
 where name = @szPubName

--if len(@uuidJob) = 0
if len(isnull(cast(@uuidJob as varchar(60)),'')) = 0
   begin
    set @qry = 'Error: No job info found in syspublications for publication ' + @szPubName
	exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR
	RAISERROR('sp_PACS_StartSnapshotAgent Error: No job info found in syspublications for publication: %s' , 16, 1,@szPubName) WITH NOWAIT
	RETURN -1
   end

set @sql = 'exec @ret = [' + @szDistServer + '].msdb.dbo.sp_start_job '
		 + ' @job_id = ''' + convert(varchar(50),@uuidJob) +  ''''

-- start job
exec sp_executesql @sql,N'@ret int OUT', @ret OUT

if @ret <> 0
   begin
    set @qry = 'Error: Unable to start snapshot agent for publication ' + @szPubName
	exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR
	RAISERROR('sp_PACS_StartSnapshotAgent Error: Unable to start snapshot agent for publication: %s' , 16, 1,@szPubName) WITH NOWAIT
	RETURN -1
   end

-- if here, sucess
set @qry = 'Sucessfully started snapshot agent for publication ' + @szPubName
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR
RAISERROR('sp_PACS_StartSnapshotAgent Info: Sucessfully started snapshot agent for publication: %s' , 0, 1,@szPubName) WITH NOWAIT

GO

