CREATE   PROCEDURE CreateFY_NY_UserDefinedTables

	@lInputFromYear numeric(4,0),
    @lCopyToYear numeric(4,0),
    @TableName varchar(250),
    @YearCol varchar(100),
    @CalledBy varchar(50) 
 
AS

/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows int
DECLARE @LogStatus varchar(200)
DECLARE @LogErrCode int
DECLARE @qry varchar(400)
 declare @proc varchar(100)
 set @proc = object_name(@@procid)
 
 SET @qry = 'Start - ' + @proc  
 + ' @lInputFromYear =' +  convert(varchar(30),@lInputFromYear) + ','
 + ' @lCopyToYear =' +  convert(varchar(30),@lCopyToYear) + ','
 + ' @TableName =' + @TableName + ','
 + ' @YearCol =' + @YearCol + ','
 + ' @CalledBy =' + @CalledBy 
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
 

-- user tables will have different columns (except for Primary Key fields)
-- depending on the user. this script generates the insert statement based on the fields
-- it finds in the current database

declare @TableName_initials varchar(20)
 set  @TableName_initials = 'up'

declare @colcount int

DECLARE @CRLF VARCHAR(2)  -- carriage return/line feed
 SET @CRLF = CHAR(13) + CHAR(10)

declare @col varchar(125)
 
/* BUILD sql statement */
 
declare @sql1 varchar(100)
  set @sql1 = 'INSERT INTO ' +  @CRLF + '    ' + @TableName  + @CRLF + '(' + @CRLF

declare @sql_InsertColumns varchar(4000)
  set @sql_InsertColumns = ''

declare @sql3 varchar(100)
  set @sql3 = 'SELECT ' +  @CRLF
declare @sql_Select varchar(4000)
  set @sql_Select = ''
declare @sql_From_and_Join varchar(1000)
  set @sql_From_and_Join = ' FROM ' + @CRLF + '	' + @TableName + ' as ' + @TableName_initials + ' with (tablockx) ' + @CRLF 
	+ ' inner join create_property_layer_prop_list cplpl with (tablockx) ' + @CRLF
	+ ' on ' + @TableName_initials + '.' + @YearCol + ' = cplpl.prop_val_yr ' + @CRLF
	+ ' and ' + @TableName_initials + '.sup_num = cplpl.sup_num ' + @CRLF
	+ ' and ' + @TableName_initials + '.prop_id = cplpl.prop_id ' + @CRLF


--
set @colcount = 0

declare cCols CURSOR FAST_FORWARD for
  SELECT c.COLUMN_NAME
    FROM information_schema.tables t join
         INFORMATION_SCHEMA.COLUMNS c 
      ON t.table_name = c.table_name
   WHERE t.table_type = 'base table'
     AND t.table_name = @TableName
   ORDER BY c.Ordinal_Position
 for read only

open cCols
fetch next from cCols into @col

while @@fetch_status = 0
 begin
  set @colcount = @colcount + 1

  if @colcount = 1
    begin
     set @sql_InsertColumns = @sql_InsertColumns + '    ' + @col + @CRLF
     if @col = @YearCol
        set @sql_Select = @sql_Select + '    ' + convert(char(4),@lCopyToYear) + @CRLF
     else
        if @col = 'sup_num'
           set @sql_Select = @sql_Select + ',    0 -- ' + @TableName_initials + '.' + @col +  @CRLF
        else
           set @sql_Select = @sql_Select + '    ' + @TableName_initials + '.' + @col +  @CRLF
    end
  else
    begin
     set @sql_InsertColumns = @sql_InsertColumns + '   ,' + @col + @CRLF
     if @col = @YearCol
        set @sql_Select = @sql_Select + '    ,' + convert(char(4),@lCopyToYear) + @CRLF
     else
        if @col = 'sup_num'
           set @sql_Select = @sql_Select + '    ,0 -- ' + @TableName_initials + '.' + @col +  @CRLF
        else
           set @sql_Select = @sql_Select + '    ,' + @TableName_initials + '.' + @col +  @CRLF
    end

  fetch next from cCols into @col

 end

 close cCols
 deallocate cCols


set @sql_InsertColumns = @sql_InsertColumns +  ')'

--print @sql1 + @sql_InsertColumns + @sql3 + @sql_Select + @sql_From_and_Join
exec(@sql1 + @sql_InsertColumns + @sql3 + @sql_Select + @sql_From_and_Join)
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
 
-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@LogTotRows,@LogErrCode

GO

