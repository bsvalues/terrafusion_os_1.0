

CREATE PROCEDURE dbo.sp_RebuildIndexes     
   @pctFrag smallint = 10,
   @excluded_tables varchar(8000) = NULL 
 AS

-- NOTE: proc must be run with the "set arithabort on" and "set quoted_identifier on"
--       options set, due to indexes on computed columns 
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows bigint
DECLARE @LogSeconds int
DECLARE @LogErrCode int
DECLARE @StartEndMsg varchar(1000)
DECLARE @StepMsg varchar(3000)
DECLARE @proc varchar(100)
    SET @proc = object_name(@@procid)

declare @dbname as varchar(50)
set @dbname = 'Database: ' + db_name()
 
    SET @StartEndMsg = 'Start - ' + @proc + ' ' + @dbname
 + ' @pctFrag =' +  isnull(convert(varchar(30),@pctFrag),'') + ','
 + ' @excluded_tables =' +  isnull(@excluded_tables,'') 


if object_id('current_activity_log') is not null
   begin 
     exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                       @status_msg = @StartEndMsg
   end
-- set variable for final status entry
 set @StartEndMsg = Replace(@StartEndMsg,'Start','End')
 
/* End top of each procedure to capture parameters */
 
DECLARE @dbId INT
    SET @dbId = db_id() -- get id for database
declare @ObjOwner sysname  
declare @ObjName varchar(255)
declare @objType varchar(255)
declare @FragPct float
declare @HoldFragPct float
declare @sql varchar(4000)
declare @status varchar(200)
declare @TotRows bigint
declare @DurSecs int
declare @StartReindex datetime
declare @MaxId bigint
declare @MaxIdChar varchar(50)
declare @cnt bigint

SET @StepMsg =  'Step 1 Determine Exclusions Start'
set @StartStep = getdate()  --logging capture start time of step

-- to be able to exclude certain tables or views from reindex if we run into issues,
-- create a permanent table that each client could always exclude certain tables

if object_id('dbo.rebuild_index_excluded') is null
   begin
      create table dbo.rebuild_index_excluded 
       (obj_name sysname,
        CONSTRAINT CPK_rebuild_index_excluded PRIMARY KEY CLUSTERED (obj_name)
       )
   end

-- create temp table to hold excluded tables from passed parm and permanent entries

-- first insert any passed parm values
declare @ExcludeTable Table (obj_name sysname)

Declare @TempStr varchar(8000)
    Set @TempStr = @excluded_tables + ','
    
While Len(@TempStr) > 0 
Begin 
   Insert Into @ExcludeTable(obj_name)
     Select SubString(@TempStr,1,CharIndex(',',@TempStr)-1)
   Set @TempStr = Right(@TempStr,Len(@TempStr)-CharIndex(',',@TempStr))
End
-- now trim leading and trailing blanks for each entry
UPDATE @ExcludeTable
  SET obj_name = LTRIM(RTRIM(obj_name))

-- insert any permanently excluded objects
insert into  @ExcludeTable(obj_name)
  select obj_name 
    from dbo.rebuild_index_excluded

if @@rowcount > 0
   begin -- permanent table has exluded entries, enter log entry for troubleshooting
    -- create comma delimited list from table entries
    set @StepMsg = ''  --'Perm exclusions: '
    select @StepMsg = CASE @StepMsg WHEN '' THEN obj_name ELSE @StepMsg + ', ' + obj_name END
      from dbo.rebuild_index_excluded
     order by obj_name
     
    set @StepMsg = 'Permanent exclusions: ' + @StepMsg

    if object_id('current_activity_log') is not null
       begin     
        exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                          @status_msg = @StepMsg
        end
   end    

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 1 Determine Exclusions End'

if object_id('current_activity_log') is not null
   begin    
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds
   end
   
--    
set @StartStep = getdate()  --logging capture start time of step
  
-- create temp table that includes info on tables needing reindexing
CREATE TABLE #frag(ObjOwner sysname,ObjName sysname,ObjDesc varchar(255),PctFrag float,TotRows bigint)
--CREATE TABLE #frag_unique(ObjOwner sysname,ObjName sysname,ObjDesc varchar(255),Max_PctFrag float,TotRows bigint)


CREATE TABLE #TableRows(ObjOwner sysname,ObjName sysname,TotRows bigint,Obj_Id bigint,ObjDesc varchar(255))
     
INSERT INTO #TableRows(ObjOwner,ObjName,TotRows,Obj_Id,ObjDesc)
    SELECT 
    schema_name(t.[schema_id]) as ObjOwner,
    t.name as ObjName, 
    TotRows = SUM 
    ( 
    CASE 
    WHEN (p.index_id < 2) AND (a.type = 1) THEN isnull(p.rows,0)
    ELSE 0 
    END 
    ) 
    ,t.[object_id]
    ,'TABLE'
    FROM sys.tables t 
         INNER JOIN 
         sys.partitions p 
      ON t.[object_id] = p.[object_id] 
         INNER JOIN 
         sys.allocation_units a 
      ON p.partition_id = a.container_id 
         INNER JOIN 
         (              
            select distinct t.name 
            from sys.indexes i  
            join  
            sys.tables t   
             on t.object_id = i.object_id 
            where i.type = 1    -- Clustered Only
            ) as z   
      ON t.name = z.name 
     GROUP BY t.[schema_id],t.[object_id],t.name 


-- remove tables without any rows
delete from #TableRows where TotRows = 0   

 -- insert indexed view names and object id's
insert into #TableRows(ObjOwner,ObjName,TotRows,Obj_id,ObjDesc)
 select distinct schema_name(o.schema_id),o.name,0,o.[object_id],'View'
   from sys.sysindexes i 
        join  
        sys.objects o 
     on i.id=o.[object_id] 
  where o.type='v'

-- remove objects in the do not rebuild list
delete from tr
  from #TableRows as tr
       join
       @ExcludeTable as et
    on tr.ObjName = et.obj_name

declare @Obj varchar(255)
declare @ObjDesc varchar(255)

declare @ObjId bigint
declare @ObjIdChar varchar(50)

select @MaxId = isnull((select count(*) from #TableRows),0)
set @MaxIdChar = convert(varchar(50),@MaxId) -- for logging purpose only
set @cnt = 1

select @ObjId = isnull((select min(Obj_id) from #TableRows),0)

while @ObjId > 0
  begin
      set @ObjIdChar = convert(varchar(50),@ObjId)
      
      select @Obj = ObjName
            ,@ObjOwner = ObjOwner
            ,@TotRows = TotRows
            ,@ObjDesc = ObjDesc
        from #TableRows 
       where Obj_Id = @ObjId


        SELECT @LogTotRows = @TotRows, 
               @LogErrCode = @@ERROR 
           SET @LogSeconds = datediff(s,@StartStep,getdate())
           SET @StepMsg =  convert(varchar(50),@cnt)  + ' of ' + @MaxIdChar
                        +  ' Evaluating ' + @ObjOwner + '.' + @Obj + ' for fragmentation'
                 
        if object_id('current_activity_log') is not null
           begin                              
           exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                             @status_msg = @StepMsg,
                                             @row_count = @LogTotRows,
                                             @err_status = @LogErrCode,
                                             @duration_in_seconds = @LogSeconds
          end
        else
           begin
              print @StepMsg
           end
          
       INSERT INTO #frag(ObjOwner,ObjName,ObjDesc,PctFrag,TotRows) 
         SELECT  @ObjOwner, @Obj ,@ObjDesc
                ,MAX(A.Avg_Fragmentation_In_Percent) as PctFrag 
                ,@TotRows
                --,A.page_count
           FROM sys.dm_db_index_physical_stats (@dbId,@ObjIdChar , NULL, NULL , 'LIMITED') AS A 
         WHERE A.page_count  >= 100 
         AND A.Avg_Fragmentation_In_Percent >= @pctFrag
         GROUP BY object_name(A.[object_id])

         delete from #TableRows where Obj_id = @ObjId
         
         select @ObjId = isnull((select min(Obj_id) from #TableRows),0)

         set @cnt = @cnt + 1
         set @StartStep = getdate()  --logging capture start time of step
      
       end

    
-- set up counters for logging progress
set @MaxId = (select count(*) from  #frag)
set @MaxIdChar = convert(varchar(50),@MaxId) -- for logging purpose only
set @cnt = 1

DECLARE curIndexes CURSOR FAST_FORWARD
for
  select f.ObjOwner,
         f.ObjName,
         f.ObjDesc,
         f.PctFrag,
         f.TotRows
    from #frag f 
 order by ObjDesc  -- to get tables first, then views
for read only

open curIndexes
fetch next from curIndexes into @ObjOwner,@ObjName ,@objType,@FragPct,@TotRows

	/* For each index */
	while @@fetch_status = 0
	  begin
      set @sql = 'ALTER INDEX ALL ON ' + @ObjOwner + '.' + @ObjName + ' REBUILD'

      set @StartStep = getdate()  --logging capture start time of step
      -- update log  
      set @status = @dbname + ' ' + convert(varchar(50),@cnt)  + ' of ' + @MaxIdChar
                    + ' Start Reindex: ' + @ObjOwner + '.' + @ObjName + ' ' + @objType 
                    + ' Percent Fragmented: ' + convert(varchar(120),@FragPct) 

      if object_id('current_activity_log') is not null
         begin
            exec dbo.CurrentActivityLogInsert @proc, @status,@TotRows,@@ERROR
         end
        else
           begin
              print @status
           end
           
      exec(@sql)

      SELECT @LogTotRows = @TotRows, 
             @LogErrCode = @@ERROR 
         SET @LogSeconds = datediff(s,@StartStep,getdate())
         SET @StepMsg =  Replace(@status,'Start','End') 

     -- set @status =  Replace(@status,'Start','End') + ' Duration in seconds: ' + convert(varchar(30),@DurSecs) 
      if object_id('current_activity_log') is not null
         begin
         exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                           @status_msg = @StepMsg,
                                           @row_count = @LogTotRows,
                                           @err_status = @LogErrCode,
                                           @duration_in_seconds = @LogSeconds
         end

      checkpoint -- force write of transaction log
      fetch next from curIndexes into @ObjOwner,@ObjName,@objType,@FragPct,@TotRows
      set @cnt = @cnt + 1
	end

close curIndexes
deallocate curIndexes

-- now update statistics if called by Job Step
-- user may not have permission to run this, but Job should
declare @calling_application nvarchar(128)

select @calling_application = APP_NAME()
if @calling_application like 'SQLAgent%'
   begin
    if object_id('current_activity_log') is not null
     begin
        exec dbo.CurrentActivityLogInsert @proc, 'sp_updatestats Starting',0,0
     end

    set @StartStep = getdate()  --logging capture start time of step 
    exec sp_updatestats  

    SET @LogSeconds = datediff(s,@StartStep,getdate())

    if object_id('current_activity_log') is not null
     begin
        exec dbo.CurrentActivityLogInsert @proc, 'sp_updatestats Ending',0,0,@LogSeconds 
     end
end
-- update log 
if object_id('current_activity_log') is not null
   begin
      SET @LogSeconds = datediff(s,@StartProc,getdate())
      exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StartEndMsg,
                                  @row_count = @@ROWCOUNT,
                                  @err_status = @@ERROR,
                                  @duration_in_seconds = @LogSeconds
   end
else
   print 'done'

GO

