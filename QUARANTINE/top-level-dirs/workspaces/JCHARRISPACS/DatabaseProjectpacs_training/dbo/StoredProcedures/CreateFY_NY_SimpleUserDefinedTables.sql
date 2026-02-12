CREATE   PROCEDURE CreateFY_NY_SimpleUserDefinedTables

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

/* FIND PK fields */
declare @col varchar(125)
declare @TableId int
declare @IndexId int

select @TableId = t_tables.id
      ,@IndexId =  si.indid 
from sysobjects as t_primarykeys
join sysobjects as t_tables on
	t_primarykeys.parent_obj = t_tables.id
join sysindexes as si on
	t_primarykeys.name = si.name
join sysfilegroups as sfg on
si.groupid = sfg.groupid
where
t_primarykeys.xtype = 'PK' and /* Only primary key constraints */
t_tables.xtype = 'U' and /* Not system tables */
objectproperty(t_tables.id, 'IsMSShipped') = 0 and
t_tables.name = @TableName

declare @keycoltable as table (orderid int identity(1,1),colName varchar(255))

insert into @keycoltable(colName)
select	sc.name 
from sysindexkeys as sik
join syscolumns as sc on
sik.id = sc.id and
sik.colid = sc.colid
where
sik.id = @TableID and
sik.indid = @IndexID
order by
sik.keyno asc
-- 

declare @keyfields varchar(4000)
set @keyfields = ''

select	@keyfields = @keyfields + sc.name + ',' 
from sysindexkeys as sik
join syscolumns as sc on
sik.id = sc.id and
sik.colid = sc.colid
where
sik.id = @TableID and
sik.indid = @IndexID
order by
sik.keyno asc

declare @keyjoin varchar(4000)
set @keyjoin = ''

select @keyjoin = @keyjoin + @TableName_initials + '.' + colName 
                + ' = fy_' + @TableName_initials + '.' + colName +  @CRLF + ' and '
 from @keycoltable order by orderid

set @keyjoin = left(@keyjoin,len(@keyjoin)- 5)

-- strip last comma
set @keyfields = left(@keyfields,len(@keyfields) -1)
-- replace year field name with actual input year value
set @keyfields = replace(@keyfields,@YearCol,convert(char(4),@lInputFromYear) + ' as ' + @YearCol )
 
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
  set @sql_From_and_Join = ' FROM ' + @CRLF + '    ' + @TableName + ' as ' + @TableName_initials + ' LEFT JOIN '
    + @CRLF + '     (select ' + @keyfields +  @CRLF
    + '        from ' + @TableName + ' with (nolock) ' + @CRLF 
    + '       where ' + @YearCol + ' = ' + convert(char(4),@lCopyToYear) + ') as fy_' + @TableName_initials + @CRLF 
    + '   on '  + @keyjoin + @CRLF
    + '  where ' + @TableName_initials + '.' + @YearCol + ' = ' + convert(char(4),@lInputFromYear) + @CRLF 
    + ' and fy_' + @TableName_initials + '.' + @YearCol + ' is null -- only return those not already inserted'
    + @CRLF 


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

