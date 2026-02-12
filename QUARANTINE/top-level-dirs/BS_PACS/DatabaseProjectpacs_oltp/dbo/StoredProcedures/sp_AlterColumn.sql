
create procedure dbo.sp_AlterColumn
	@szTable sysname,
	@szColumn sysname,
	@szDefinition varchar(8000),
    @Allow_Nulls bit 
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
 + ' @szTable =' + @szTable + ','
 + ' @szColumn =' + @szColumn + ','
 + ' @szDefinition =' + @szDefinition + ','
 + ' @Allow_Nulls =' + convert(varchar(4),@Allow_Nulls)

 exec dbo.CurrentActivityLogInsert @proc, @qry
/* End top of each procedure to capture parameters */


-- check for table existence
if not exists (
	select *
	from sysobjects
	where name = @szTable
      and xtype = 'U'
)
begin
    exec dbo.CurrentActivityLogInsert @proc, 'Info: Table does not exists in this database',@@ROWCOUNT,@@ERROR
    RAISERROR('sp_AlterColumn Info: Table %s does not exists in this database.' , 16, 1,@szTable) WITH NOWAIT
    return -1
end


if not exists (
	select *
	from syscolumns
	where id = object_id(@szTable)
	and name = @szColumn
)
begin
    exec dbo.CurrentActivityLogInsert @proc, 'Info: Column does not exists in this table',@@ROWCOUNT,@@ERROR
    RAISERROR('sp_AlterColumn Info: Column %s does not exists in table %s.' , 16, 1,@szColumn,@szTable) WITH NOWAIT
    -- column does not exist, exit
	return -1
end

-- make sure nullability is not in definition field
if CHARINDEX(' NULL', @szDefinition) > 0
 begin
    exec dbo.CurrentActivityLogInsert @proc, 'Error: Nullability used in definition parm, should use @Allow_Nulls parm',@@ROWCOUNT,@@ERROR
    RAISERROR('sp_AlterColumn Err: Table: %s,Column: %s,Def:%s - Nullability used in definition parm, should use @Allow_Nulls parm instead.' , 16, 1,@szTable,@szColumn,@szDefinition) WITH NOWAIT
    -- column does not exist, exit
	return -1
end  

-- determine sql server version, different syntax for versions is required
DECLARE @ver varchar(7)
SELECT @ver = CASE
 WHEN CHARINDEX('9.00', @@VERSION) > 0 THEN '2005'
 WHEN CHARINDEX('8.00', @@VERSION) > 0 THEN '2000'
 ELSE '2005' -- no clients are lower than 2000, default to 2005
END  

declare @NULLABLE varchar(20)
declare @ret int  -- for return value from called procedures
declare @szSQL nvarchar(4000)
declare @replicated bit
    set @replicated = (select dbo.fn_IsTableReplicated(@szTable))
declare @TotRows bigint

if @Allow_Nulls = 1 
   set @NULLABLE = ' NULL '
else
   set @NULLABLE = ' NOT NULL '

-- build sql statement to execute if we get to end of validation steps
set @szSQL = 'alter table ' + quotename(@szTable) 
         + ' alter column ' + quotename(@szColumn)
         + ' ' + @szDefinition
         + @NULLABLE

if @Allow_Nulls = 0 
   -- nulls not allowed, check for nulls in column and error if found
   begin
     declare @vsql nvarchar(4000)
     declare @params nvarchar(4000)
     declare @bad int
       set @vsql = ' if exists(select 1 from ' + quotename(@szTable) 
                 + ' where ' + quotename(@szColumn) + ' is null) '
                 + '   set @nullexists = 1 '
       set @params = '@nullexists      int      OUTPUT'
       EXEC sp_executesql @vsql, @params,@nullexists = @bad OUTPUT  

       if @bad = 1  
		 begin
		   exec dbo.CurrentActivityLogInsert @proc, 'Error altering column, nulls not allowed in definition but nulls exist in column',@@ROWCOUNT,@ret
		   RAISERROR('sp_AlterColumn Error: Error altering Column %s on table %s. Nulls not allowed in definition but nulls exist in column' , 16, 1,@szColumn,@szTable) WITH NOWAIT
		   return @bad
		 end   
   end

if @ver = '2000' and @replicated = 1
   -- have to drop replication to alter a column in sql 2000 and earlier
   begin
      exec dbo.sp_DropTableReplication @szTable
   end


-- if we reach here, should have valid alter table statement to execute
exec @ret =  sp_executesql @szSQL

if @ret <> 0
 begin
   exec dbo.CurrentActivityLogInsert @proc, 'Error altering column',@@ROWCOUNT,@ret
   RAISERROR('sp_AlterColumn Error: Error altering Column %s on table %s.' , 16, 1,@szColumn,@szTable) WITH NOWAIT
   return @ret
 end 
else
begin
  return 0
end

GO

