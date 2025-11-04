
create procedure dbo.usp_ccGetTableInfo
   @TableName sysname
  ,@PKColJoin varchar(2000) OUTPUT
  ,@PKColNames varchar(1000) OUTPUT
  ,@TrackedColumns varchar(5000) OUTPUT
  ,@PKDelimitedNames varchar(2000) OUTPUT
  ,@PKOldNewSQL varchar(2000) OUTPUT

as 
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows int
DECLARE @LogSeconds int
DECLARE @LogErrCode int
DECLARE @StartEndMsg varchar(1000)
DECLARE @StepMsg varchar(3000)
DECLARE @proc varchar(100)
    SET @proc = object_name(@@procid)
 
    SET @StartEndMsg = 'Start - ' + @proc  
 + ' @TableName =' +  isnull(convert(varchar(30),@TableName),'') 
 
 exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                   @status_msg = @StartEndMsg
 
-- set variable for final status entry
 set @StartEndMsg = Replace(@StartEndMsg,'Start','End')
 
/* End top of each procedure to capture parameters */

/*
-- assumes calling table has created 2 temp tables
create table #PrimaryKeyColumns(column_name sysname, ordinal_position int)
create table #tbl_info (column_name sysname, column_id int,data_type varchar(255), is_computed bit )   
*/

BEGIN TRY   --- SET UP ERROR HANDLING

DECLARE @CRLF VARCHAR(2)
    SET @CRLF = CHAR(13) + CHAR(10)

set @StepMsg = 'Step 1 '
    
INSERT INTO #PrimaryKeyColumns (column_name, ordinal_position)
SELECT c.COLUMN_NAME, c.ORDINAL_POSITION
FROM	INFORMATION_SCHEMA.TABLE_CONSTRAINTS as pk 
        inner join
	 INFORMATION_SCHEMA.KEY_COLUMN_USAGE as c
	ON	c.TABLE_NAME = pk.TABLE_NAME
AND	c.CONSTRAINT_NAME = pk.CONSTRAINT_NAME
AND	CONSTRAINT_TYPE = 'PRIMARY KEY'
WHERE 	pk.TABLE_NAME = @TableName

set @StepMsg = 'Step 2 '

INSERT INTO #tbl_info(column_name, column_id,data_type, is_computed)
SELECT sc.name as column_name,  sc.column_id, st.name as data_type, sc.is_computed 
  FROM sys.columns as sc
	   join 
	   sys.types as st
    ON sc.system_type_id = st.system_type_id
   and sc.user_type_id = st.user_type_id
       join
       TA_TRACKED_COLUMN_NAMES as tc
    ON sc.name = tc.column_name
       left join
       #PrimaryKeyColumns as pk
    ON tc.column_name = pk.column_name
 WHERE sc.[object_id] = object_id(@TableName) 
   AND st.name not in('timestamp','text','ntext','image','XML','cursor','sql_variant') 
   AND sc.is_computed = 0
   AND pk.column_name is null -- don't get PK columns again

set @StepMsg = 'Step 3 '

SELECT @PKColNames  = COALESCE(@PKColNames + ', ', '') + QUOTENAME(COLUMN_NAME)  
FROM #PrimaryKeyColumns 
order by ORDINAL_POSITION

set @StepMsg = 'Step 4 '

SELECT	@PKColJoin = COALESCE(@PKColJoin + ' and', ' on') + ' new.' + COLUMN_NAME + ' = old.' + COLUMN_NAME + @CRLF
FROM	#PrimaryKeyColumns
order by ORDINAL_POSITION

set @StepMsg = 'Step 5 '

SELECT @TrackedColumns = COALESCE(@TrackedColumns + ', ', '') + QUOTENAME(column_name)
  FROM #tbl_info
ORDER BY column_id

set @StepMsg = 'Step 6 '

SELECT	@PKDelimitedNames = COALESCE(@PKDelimitedNames + '|','' ) + COLUMN_NAME  
FROM	#PrimaryKeyColumns
order by ORDINAL_POSITION

--print @PKDelimitedNames

set @StepMsg = 'Step 7 '

SELECT	@PKOldNewSQL =  COALESCE(@PKOldNewSQL + '+ ''|''','' ) + ' + convert(varchar(200),coalesce(new.' + QUOTENAME(COLUMN_NAME) +',old.' + QUOTENAME(COLUMN_NAME) + ')) '   + @CRLF 
FROM	#PrimaryKeyColumns
order by ORDINAL_POSITION

-- removing leading +
set @PKOldNewSQL = substring(@PKOldNewSQL,4,len(@PKOldNewSQL))
--print @PKOldNewSQL

-- end of procedure update log
SET @LogSeconds = datediff(s,@StartProc,getdate())
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StartEndMsg,
                                  @row_count = @@ROWCOUNT,
                                  @err_status = @@ERROR,
                                  @duration_in_seconds = @LogSeconds
                                  
END TRY

BEGIN CATCH
	DECLARE
	@ERROR_SEVERITY INT,
	@ERROR_STATE INT,
	@ERROR_NUMBER INT,
	@ERROR_LINE INT,
	@ERROR_MESSAGE VARCHAR(245),
    @AppMsg varchar(2000)
    
	SELECT
	@ERROR_SEVERITY = ERROR_SEVERITY(),
	@ERROR_STATE = ERROR_STATE(),
	@ERROR_NUMBER = ERROR_NUMBER(),
	@ERROR_LINE = ERROR_LINE(),
	@ERROR_MESSAGE = ERROR_MESSAGE(),
	@AppMsg = 'Error in proc: ' + @proc + ' ' + @StepMsg + @ERROR_MESSAGE
	
	exec dbo.CurrentActivityLogInsert @proc, @AppMsg,0,@ERROR_NUMBER

   RAISERROR(@AppMsg , 16, 1) 

	
END CATCH

GO

