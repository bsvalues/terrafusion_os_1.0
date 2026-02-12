
CREATE PROCEDURE sp_MiniProfiler  
    @ProcessId int = NULL
   ,@database varchar(256) = NULL
   ,@SecondsToRunTrace int = 60
   ,@SearchFor varchar(100) = 'ALL'

AS 
--** Pass value in @ProcessId if you only want to capture specific @@SPID
--** Pass 'ALL' or database name, if db other than current is required
--** Modify the @SecondsToRunTrace to run the number of seconds that 
--** think you need to capture the information you want

--** Modify the @SearchFor value to have it return just those rows that
--** contain the value you are looking for in the InitialCmd field

-- this process creates a table called _trace_yyyymmdd 

-- !!! NOTE, you need to be logged in as sa (or have sa rights) to run this!!!
--declare @database varchar(256)
IF @database IS NULL
   set @database =  db_name()
IF @database = 'ALL'
   set @database = NULL

declare @TableToCreate varchar(100)
  set @TableToCreate = '_trace_' + convert(varchar(20),getdate(),112)

print 'Trace table created: ' + @TableToCreate
set nocount on

DECLARE @sql_handle binary(20)
DECLARE @handle_found bit
DECLARE @stmt_start int
DECLARE @stmt_end int
DECLARE @line varchar(8000)
DECLARE @last_stmt_start int
DECLARE @InitialCmd varchar(8000)
DECLARE @Buffer varchar(100)

declare @tblSQL varchar(1000)

set @tblSQL = 'if object_id(''' + @TableToCreate + ''') is not null'
            + ' Drop TABLE ' + @TableToCreate 
            + ' CREATE TABLE ' + @TableToCreate + '('
            + 'id int ,spid int,'
            + 'blocked smallint,dbName varchar(256),cpu int,physicalio bigint,'
            + 'login_time datetime,last_batch datetime,'
            + 'hostname varchar(256),prog_name varchar(256),loginame varchar(256),'
            + 'logdate datetime default getdate(),InitialCmd varchar(8000),'
            + 'LastCmd varchar(8000)) '


exec (@tblSQL)
set @tblSQL = 'truncate table ' + @TableToCreate 

exec (@tblSQL)

print 'Creating table ' + @TableToCreate

if object_id('_hold_trace') is not null
   begin
     truncate table _hold_trace
     drop table _hold_trace
   end

create table _hold_trace (id int identity(1,1),spid int,blocked smallint,
             dbName varchar(256),cpu int,physicalio bigint,
             login_time datetime,last_batch datetime,
             hostname varchar(256),prog_name varchar(256),
             loginame varchar(256),InitialCmd varchar(8000),LastCmd varchar(8000)) 

if object_id('_hold_buffer') is not null
   begin
     truncate table _hold_buffer
     drop table _hold_buffer
   end

create table _hold_buffer (EventType varchar(200),EventParm int,EventInfo varchar(8000))

declare @StartTime datetime
declare @EndTime datetime
declare @CurrentTime datetime


set @StartTime = getdate()
set @CurrentTime = getdate()
set @EndTime = dateadd(s,@SecondsToRunTrace,@StartTime)

declare @i int

while @CurrentTime  < @EndTime
  begin
   declare cDBCC CURSOR local FAST_FORWARD for
  
   select distinct spid
   from master.dbo.sysprocesses s with (nolock)

    where spid > 50  -- not system processes
    and spid <> @@spid  -- not this process
    and (db_name(dbid) = @database or @database IS NULL)
    and (spid = @ProcessId or @ProcessId IS NULL)

    for read only

    open cDBCC
    fetch next from cDBCC into @i

    while @@fetch_status = 0
       begin

        -- find handle
        SET @last_stmt_start = -1

	    SET @handle_found = 0

        SELECT	@sql_handle = sql_handle,
		        @stmt_start = stmt_start/2,
		        @stmt_end = CASE 
                    WHEN stmt_end = -1 THEN -1 
                    ELSE stmt_end/2 END
	     FROM master.dbo.sysprocesses
	    WHERE	spid = @i
	      AND ecid = 0

        IF @sql_handle <>  0x0 -- handle found
	   BEGIN
		SET @line = 
			(
				SELECT 
					SUBSTRING(	text,
							COALESCE(NULLIF(@stmt_start, 0), 1),
							CASE @stmt_end 
								WHEN -1 
									THEN DATALENGTH(text) 
								ELSE 
									(@stmt_end - @stmt_start) 
	    						END
						) 
	   			FROM ::fn_get_sql(@sql_handle)
	  		)
           END
        truncate table _hold_buffer

        SET @Buffer = 'DBCC INPUTBUFFER(' + ltrim(STR(@i)) + ') WITH NO_INFOMSGS' 
        INSERT INTO _hold_buffer 
        EXEC (@Buffer)
 
        SET @InitialCmd = (SELECT EventInfo FROM _hold_buffer)

        INSERT INTO _hold_trace 
          (spid ,blocked,dbName ,cpu ,physicalio,
           login_time ,last_batch ,hostname ,prog_name ,
           loginame ,InitialCmd ,LastCmd ) 
       
        SELECT spid,blocked,db_name(dbid),cpu,physical_io,login_time,
               last_batch,hostname,program_name,loginame,@InitialCmd,@line
        from master.dbo.sysprocesses with(nolock) 
        where spid = @i

        fetch next from cDBCC into @i

       end

   close cDBCC
   deallocate cDBCC

   set @CurrentTime = getdate()
  end

if object_id('tempdb..#tbl') is not null
begin
	exec('drop table #tbl')
end
create table #tbl (id int,spid int,InitialCmd varchar(8000),LastCmd varchar(8000))

INSERT INTO #tbl 
SELECT max(id), spid,ISNULL(LTRIM(InitialCmd),'') ,ISNULL(LastCmd,'') 
 from _hold_trace
group by spid,ISNULL(LTRIM(InitialCmd),'') ,ISNULL(LastCmd,'')

set @tblSQL = 'INSERT INTO ' + @TableToCreate
             + ' (id,spid ,blocked,dbName ,cpu ,physicalio,'
             + ' login_time ,last_batch ,hostname ,prog_name ,'
             + ' loginame ,InitialCmd ,LastCmd)'
             + ' select h.id,h.spid ,blocked,dbName ,cpu ,physicalio,'
             + ' login_time ,last_batch ,hostname ,prog_name ,'
             + ' loginame ,h.InitialCmd ,h.LastCmd '
             + ' from _hold_trace h join #tbl t on h.id = t.id' 

exec (@tblSQL)

truncate table _hold_trace
drop table _hold_trace

set @tblSQL = 'select id,spid,InitialCmd,LastCmd,dbName,prog_name,hostname,last_batch'
             + ' ,login_time,cpu,physicalio,loginame,logdate'
             + ' from ' + @TableToCreate 


if @SearchFor <> 'ALL'
   set @tblSQL = @tblSQL + ' AND InitialCmd like  ''' + '%' + @SearchFor + '%'''

set @tblSQL = @tblSQL + ' ORDER BY id'

exec (@tblSQL)

GO

