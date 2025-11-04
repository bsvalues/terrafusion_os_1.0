/*
 exec dbo.sp_CNV_GenerateConversionPROC @table_name = 'land_detail', @table_type = 'DATA'
                  , @path ='C:\Robbie\ConversionInfo\GenericScripts\GeneratedConversionProcs'

add table_notes for each conversion table in a TA_WorkDB database
pull in like pv hs_cap goes on child segements if overriding values, have to override hs if you want it to stay , pv values being overwritten, etc
*/

CREATE PROCEDURE dbo.sp_CNV_GenerateConversionPROC

  @table_name varchar(500)  
, @table_type varchar(10)   -- valid values 'CODE' or 'DATA'
, @path varchar(2000)  --  'C:\Robbie\ConversionInfo\GenericScripts'
AS
SET NOCOUNT ON
declare @file_name  varchar(800); set @file_name = 'sp_CNV_' + @table_type + '_' + @table_name + '.sql'
declare @FullFilePathName varchar(3000); set @FullFilePathName = @path + '\' + @file_name
declare @triggers_exist char(1)
declare @trigger_name sysname

DECLARE @result INT
DECLARE @DelStmt varchar(1050)

DECLARE @CRLF VARCHAR(2)  -- carriage return/line feed
 SET @CRLF = CHAR(13) + CHAR(10)

declare @TableId int
declare @IndexId int

print @FullFilePathName

EXEC Master..xp_fileexist @FullFilePathName, @result output
SET @DelStmt = 'del ' + @FullFilePathName

IF (@result = 1)  --if file exists delete it, otherwise exit
BEGIN 

print @DelStmt
EXEC Master..xp_cmdshell @DelStmt, no_output
END

-- get just PK fields in order for our join statement
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
t_tables.name = @table_name

declare @keycoltable as table (row_id int identity(1,1),colName varchar(255))


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

declare @PK_fields varchar(8000)
set @PK_fields = ''  -- have to initialize to ''
select @PK_fields = @PK_fields + colName + ','
  from @keycoltable order by row_id
-- remove last comma
set @PK_fields = substring(@PK_fields, 1, len(@PK_fields) -1)

-- gather column info for requested table
declare @columns table
 (row_id int identity(1,1), COLUMN_NAME sysname,column_with_def varchar(1000), data_type varchar(200)
 , is_computed smallint, is_identity smallint, ordinal_position smallint
 , insert_prefix varchar(10), select_prefix varchar(50), column_default varchar(50), numeric_type char(1)
 , PK_order tinyint default 0
 )
insert into @columns(COLUMN_NAME, column_with_def,data_type,is_computed,is_identity,ordinal_position, insert_prefix, select_prefix,column_default)
select  ic.COLUMN_NAME
      , ic.COLUMN_NAME  + '   -- ' + 
       case data_type 
         when  'varchar' then data_type + ' (' + case when  CHARACTER_MAXIMUM_LENGTH  < 0 then 'MAX' else convert(varchar(100),CHARACTER_MAXIMUM_LENGTH) end   + ')'
         when  'varbinary' then data_type + ' (' + case when  CHARACTER_MAXIMUM_LENGTH  < 0 then 'MAX' else convert(varchar(100),CHARACTER_MAXIMUM_LENGTH) end   + ')'
         when  'char'   then data_type + ' (' + convert(varchar(100),CHARACTER_MAXIMUM_LENGTH)  + ')'
         when  'nvarchar' then data_type + ' (' + case when  CHARACTER_MAXIMUM_LENGTH  < 0 then 'MAX' else convert(varchar(100),CHARACTER_MAXIMUM_LENGTH) end   + ')'
         when  'numeric' then data_type + ' (' + convert(varchar(40),NUMERIC_PRECISION) + ',' + convert(varchar(40),NUMERIC_SCALE)  + ')'
         when  'money' then data_type + ' (' + convert(varchar(40),NUMERIC_PRECISION) + ',' + convert(varchar(40),NUMERIC_SCALE)  + ')'
         else data_type --timestamp,image,xml,int, smallint,datetime,uniqueidentifier,tinyint,smalldatetime,float,real,bigint,bit
	   end
	 + case is_nullable 
	     when 'Yes' then '  NULL' else '  NOT NULL' end

   +  CASE ISNULL(ic.COLUMN_DEFAULT,'') when '' then '' else '  Default Value: ' + ic.COLUMN_DEFAULT end
       
   + case sc.is_computed when 1 then ' Computed Column Do Not Insert Data ' else '' end
   +  case data_type when 'timestamp' then ' Timestamp column Do Not Insert Data ' else '' end
   +  case sc.is_identity when 1 then ' IDENTITY column Do Not Insert Data ' else '' end
  ,ic.data_type 
  ,sc.is_computed
  ,sc.is_identity
  ,ic.ORDINAL_POSITION
  ,'' as insert_prefix
  ,' NULL AS ' as select_prefix
  ,replace(replace(replace(ic.COLUMN_DEFAULT,'(',''), ')',''),'''','') as column_default
 from INFORMATION_SCHEMA.COLUMNS as ic
      join
	  (  select object_name(object_id) as table_name, name as column_name,is_computed,is_identity
           from sys.columns
		   -- where is_computed = 0
		   ) as sc
	 on ic.TABLE_NAME = sc.table_name
	and ic.COLUMN_NAME = sc.column_name

where ic.table_name = @table_name
order by ORDINAL_POSITION

update @columns
   set numeric_type = 'Y'
   where data_type in('numeric','money','int','smallint','tinyint','real','bigint','bit')

update @columns
   set PK_order = pk.row_id
  from @columns as c
       join 
	   @keycoltable as pk
   on c.COLUMN_NAME = pk.colName


select * from @columns where column_default is not null order by row_id

create table #index_cols
(
    index_name varchar(255),
    index_description varchar(1000),
    index_keys varchar(4000)
)

-- get index info for table
exec ('INSERT INTO #index_cols
       EXEC sp_helpindex  ''' + @table_name + '''' )
alter table #index_cols add row_id int identity(1,1)

update #index_cols
   set index_description = replace(index_description,'located on PRIMARY','')

select * from #index_cols

Declare @pacs_version table (pacs_version varchar(20))
 INSERT INTO @pacs_version(pacs_version) select top 1 version from dbo.pacs_system


declare @x int
declare @msg varchar(max)
DECLARE @bContinue bit

   


set @msg = 'set ansi_nulls on'  ; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'set ansi_padding on' ; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'set ansi_warnings on' ; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'set arithabort on' ; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'set quoted_identifier on'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'set numeric_roundabort off' ; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'go' ; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = '' ; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

set @msg = 'if object_id(''dbo.SP_CNV_' + @table_type + 'TABLE_' + @table_name + ''') is not null'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = '   begin '; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = '      drop procedure dbo.SP_CNV_' + @table_type + 'TABLE_' + @table_name; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = '   end'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'GO'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

set @msg = 'CREATE PROCEDURE dbo.SP_CNV_' + @table_type + 'TABLE_' + @table_name; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = '    @yr_to_process varchar(4)  -- valid values are a single 4 digit year or ALL for all years' ; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'AS'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'SET NOCOUNT ON'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'declare @rows_inserted int'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = '    set @rows_inserted = 0'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'DECLARE @proc varchar(100)'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'SET @proc = object_name(@@procid)'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = '/*'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

-- show pacs version it was generated from
select @msg = [version] from dbo.pacs_system
set @msg = 'proc generated based on pacs version: ' + @msg; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

-- unique index - 
declare @index_description varchar(1000)
set @msg = ' TABLE NAME: ' + @table_name; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = ' UNIQUE INDEXES: ' ; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @x = 1
set @bContinue = 1
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
while @bContinue = 1
  begin
     set @msg = ''
     if exists(select 1 from #index_cols where row_id = @x)
	    begin
           select @msg =  '   ' + index_description + ' on: ' + index_keys
		     from #index_cols 
		          where index_description like '%Unique%' and row_id = @x 
		   set @x = @x + 1
	       if len(@msg) > 0 
		      begin
		         exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
			  end
	    end
	else
     set @bContinue = 0
  end
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name


declare @FK table(FK_val varchar(8000), row_id int identity(1,1) )
insert into @FK(FK_val)
select  ReferenceType + ' FROM   ' + fk_col + '  TO   ' + referenced_col  
from dbo.fn_GetForeignKeyInfoForATable(@table_name,'dbo')
ORDER BY ReferenceType,fk_name

set @x = 1
set @bContinue = 1
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
if exists(select 1 from @FK where row_id = @x)
   begin
		   set @msg = ' FOREIGN KEYS:'
		   exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
   end
else
  begin
	 set @msg = ' NO FOREIGN KEYS'
	 exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
  end

while @bContinue = 1
  begin
     if exists(select 1 from @FK where row_id = @x)
	    begin

           select @msg = '     ' +  (select FK_val from @FK where row_id = @x)
		   set @x = @x + 1
	       if len(@msg) > 0 
		      begin
		         set @msg = '  ' + @msg
				 exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
			  end
	    end
	else
     set @bContinue = 0

  end
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name


declare @Triggers table(Trigger_val varchar(8000), row_id int identity(1,1), trigger_name sysname)
insert into @Triggers(Trigger_val,trigger_name)
 select trigger_name + ' ' + trigger_status + ' ' + trigger_event
       ,trigger_name
      
 from dbo.fn_GetTriggerInfoForATable(@table_name,'dbo')
order by trigger_event, trigger_name

set @x = 1
set @bContinue = 1
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
if exists(select 1 from @Triggers where row_id = @x)
   begin
	set @msg = ' TRIGGERS:'
	set @triggers_exist = 'Y'
	exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
   end
else
   begin
   set @msg = ' NO TRIGGERS'
   set @triggers_exist = 'N'
   exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
   end

while @bContinue = 1
  begin
     if exists(select 1 from @Triggers where row_id = @x)
	    begin
           select @msg = '     ' +  (select Trigger_val from @Triggers where row_id = @x)
		   set @x = @x + 1
	       if len(@msg) > 0 
		      begin
		         set @msg = '  ' + @msg
				 exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
			  end
	    end
	else
     set @bContinue = 0

  end

set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

set @msg = '*/' ; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name


if @triggers_exist = 'Y'
   begin
       set @msg = '-- WE MIGHT WANT TO DISABLE SOME OR ALL TRIGGERS FOR PROCESSING'  ; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
    
      set @msg = '    -- alter table dbo.' + @table_name + ' disable trigger all'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

		set @msg = ''
		 exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
		set @bContinue = 1
		set @x = 1
		while @bContinue = 1
		
		  begin
			 if exists(select 1 from @Triggers where row_id = @x)
				begin
				   select @trigger_name = trigger_name from @Triggers where row_id = @x
				   select @msg = '-- alter table dbo.' + @table_name + ' disable trigger ' +  @trigger_name
				   set @x = @x + 1
				   if len(@msg) > 0 
					  begin
						 set @msg = '  ' + @msg
						-- print @msg
						 exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
					  end
				end
			else
			 set @bContinue = 0

		  end
   end

set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

set @msg = '-- CODE FOR TURNING OFF CHANGE LOG '; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

set @msg = 'delete chg_log_user where machine = host_name()   AND HOSTID = host_id()'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'exec SetChgLogUser -1'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'exec SetMachineLogChanges 0'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'UPDATE CHG_LOG_USER '; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = '   SET LOG_CHANGES = 0'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = ' WHERE MACHINE = host_name()'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = '   AND HOSTID = host_id() '; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = '   and pacs_user_id = -1 -- just to be sure'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

set @msg = '-- GET YEARS TO BE CONVERTED: assumes 2 tables have been created in pacs db: cnv_current_year and cnv_history_years'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = '   --  created in proc SP_CNV_WorkTABLE_conversion_years '; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

set @msg = 'Declare @current_year numeric(4,0)'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'declare @process_year numeric(4,0)'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'select @current_year = (select current_year from pacs_oltp_sanpatricio_test.dbo.cnv_current_year)'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name	  
set @msg = 'declare @years_to_convert table (yr numeric(4,0))'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = ' insert into @years_to_convert(yr)'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'select distinct history_year '; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'from dbo.cnv_history_years '; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = '       UNION'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'select @current_year'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name


-- some tables have a next id field, find starting value if it does 
--declare @next_id int  
declare @table_id_column_name sysname
declare @next_id_table_name sysname
declare @next_id_column_name sysname

if object_id('dbo._cnv_pacs_tables_being_converted') is not null
   begin
      select
			 @table_id_column_name = table_id_column_name
			,@next_id_table_name = next_id_table_name
			,@next_id_column_name = next_id_column_name
	   from dbo._cnv_pacs_tables_being_converted
	  where table_name = @table_name
   end	

if @table_id_column_name is not null  -- has an id field that needs to be generated, so determine starting value
   begin
      set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
      set @msg = '/* Determine next id value */'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
      set @msg = 'declare @next_id int'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name  -- right now all of pacs is int - may need to someday change to bigint  
      set @msg = 'select @next_id = isnull((select max(' + @table_id_column_name + ') from dbo.' + @table_name + '),0) + 1'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
      set @msg = 'print ''  starting next land id: ''  + convert(varchar(55),@next_id)'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
      set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

	  -- need to create an XREF table that contains PK values of this table and source table PK, so generate stub with PACS PK field, will need to manually add source key fields
      set @x = 1
      set @bContinue = 1

      set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
      set @msg = '/* Create XREF table for new id to source  */'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
      set @msg = 'if not exists(select 1 from sys.tables where name = ''_cnv_' + @table_name + 'PACS_to_SOURCE_XREF'')'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
      set @msg = '   begin'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
      set @msg = '       exec(''create table dbo._cnv_' + @table_name + 'PACS_to_SOURCE_XREF'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
      set @msg = '              ('; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
	  -- pk fields for pacs table
		while @bContinue = 1
		  begin
			 if exists(select 1 from @columns where PK_order = @x)
				begin
					if @x = 1
					  begin
						  select @msg = '                ' +  replace(column_with_def,'--','') 
							from @columns where PK_order = @x
						  exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
					  end
				   else
					  begin
						  select @msg = '               ,' +  replace(column_with_def,'--','') 

								from @columns where PK_order = @x
						  exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
					  end
				   set @x = @x + 1
				end
			else
			 set @bContinue = 0

		  end

	set @msg = '--Create PK based on Source PK fields,CONSTRAINT CPK__cnv_' + @table_name + 'PACS_to_SOURCE_XREF  PRIMARY KEY CLUSTERED (source_columns) ))'''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
	set @msg = ' ) '; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

	set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
		  set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
   end

set @msg = '/*  ********** START CONVERSION NOTES FOR THIS RUN *******'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = '  ********** END CONVERSION NOTES FOR THIS RUN ******* */'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

set @msg = '/*  ********** CREATE SOURCE TABLE ******* */'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = '-- template source table will contain PK field values - will need to modify as needed'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @x = 1
set @bContinue = 1
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

set @msg = 'CREATE TABLE #tmp '; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = ' ( '; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

while @bContinue = 1
  begin
     if exists(select 1 from @columns where PK_order = @x)
	    begin
		    if @x = 1
			  begin
			      select @msg = '  ' + case when COLUMN_NAME = @table_id_column_name then replace(column_with_def,'--','') + ' IDENTITY(1,1)'
				                            else  replace(column_with_def,'--','') 
											end
						from @columns where PK_order = @x
				  exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
			  end
           else
			  begin
			      select @msg = ' ,' + case when COLUMN_NAME = @table_id_column_name then replace(column_with_def,'--','') + ' IDENTITY(1,1)'
				                            else  replace(column_with_def,'--','') 
											end
						from @columns where PK_order = @x
				  exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
			  end
		   set @x = @x + 1
	    end
	else
     set @bContinue = 0

  end
set @msg = ' ) '; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = '/* Reseed identity value to next id value */'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'DBCC CHECKIDENT(#tmp, RESEED,@next_id)'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

set @msg = '-- !! ADD INSERT INTO #tmp from SOURCE'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

set @msg = '-- !!ADD INSERT INTO XREF from #tmp'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

set @msg = '/* *** INSERT INTO PACS TABLE  *** */'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

set @msg = 'INSERT INTO dbo.' + @table_name  ; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = '('  ; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

declare @col varchar(1000)
declare @select_prefix varchar(50)
declare @column_default varchar(50)
declare @data_type varchar(200)
declare @is_identity smallint
declare @is_computed smallint
declare @numeric_type char(1)

set @bContinue = 1
set @x = 1
while @bContinue = 1
		
	begin
		if exists(select 1 from @columns where row_id = @x)
			begin
				select @col = column_with_def, @data_type = data_type 
					  ,@is_identity = is_identity, @is_computed = is_computed
				  from @columns where row_id = @x

				if @data_type in('timestamp') OR @is_computed = 1 OR @is_identity = 1
				   begin 
					  set @msg = ' -- '
				   end
				else
				   begin 
					  set @msg = '  '   
					end
				if @x = 1 
				   begin 
					  set @msg = @msg + ' ' +  @col
				   end
				else
				   begin
					 set @msg = @msg + ',' + @col
				   end
				--print @msg
				exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
				set @x = @x + 1
			end
	  else  -- no more columns
	     begin
		  set @bContinue = 0
		 end

	end

set @msg = ')'  ; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'SELECT'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

set @bContinue = 1
set @x = 1
while @bContinue = 1
		
	begin
		if exists(select 1 from @columns where row_id = @x)
			begin
				select @col = column_with_def, @data_type = data_type ,@select_prefix = select_prefix, @column_default = column_default
					  ,@is_identity = is_identity, @is_computed = is_computed, @numeric_type = numeric_type
				  from @columns where row_id = @x

				if @data_type in('timestamp') OR @is_computed = 1 OR @is_identity = 1
				   begin 
					  set @msg = '  -- '
				   end
				else
				   begin 
					  set @msg = '   '   
					end
				if @x = 1 
				   begin 
					  set @msg = @msg + ' '  
				   end
				else
				   begin
					 set @msg = @msg + ','  
				   end
				if len(isnull(@column_default,'')) > 0
				   begin
				   --  print @column_default 
					-- print @col
				      if (@column_default = 'NULL' OR @numeric_type = 'Y' )
					     begin 
						  set @msg = @msg + @column_default + ' AS ' + @col
					     end
			          else
					    begin 
						  set @msg = @msg + '''' +  @column_default + ''' AS ' + @col
					    end
                   end
				else
				   begin
					 set @msg = @msg + @select_prefix  +  @col
				   end
				--print @msg
				exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
				set @x = @x + 1
			end
	  else  -- no more columns
	     begin
		  set @bContinue = 0
		 end

	end


set @msg = '  FROM #tmp as src '; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = '       LEFT JOIN '; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = '       ' + 'dbo.' +  @table_name + ' AS dest ' + '  -- PK ' + @PK_fields ; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = ' WHERE 1=1   -- template is generated with jon on PK fields - may need to modify'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name





select * from @keycoltable

-- now write join for each pk column
set @x = 1
set @bContinue = 1
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

while @bContinue = 1
  begin
     if exists(select 1 from @keycoltable where row_id = @x)
	    begin
          	select @msg = ' and src.' + colName + ' = dest.' + colName from @keycoltable where row_id = @x; 
	        exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
		   set @x = @x + 1
	    end
	else
     set @bContinue = 0

  end

set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'set @rows_inserted = @@ROWCOUNT'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = '       print  @proc + '' total land_detail inserted for year '' + convert(varchar(55), @process_year)  + '': '' + convert(varchar(55), @rows_inserted)'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

if @table_id_column_name is not null
   begin
      set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
      set @msg = '/* update next id value */'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
      set @msg = 'if @rows_inserted > 0'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name   
      set @msg = '   begin'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name 	   
      set @msg = '       select @next_id = isnull((select max(' + @table_id_column_name + ') from dbo.' + @table_name + '),0) + 1'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
      set @msg = '       update ' + @next_id_table_name + ' set ' + @next_id_column_name + ' = @next_id'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name 
      set @msg = '       print ''   ending next land id: ''  + convert(varchar(55),@next_id)'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
      set @msg = '   end'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name 
      set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
   end
  

--declare @keyjoin varchar(max)
--set @keyjoin = ''

--select @keyjoin = @keyjoin + 'src' + '.' + colName 
--                + ' = dest' + '.' + colName +  @CRLF + ' and '
-- from @keycoltable order by orderid

--set @keyjoin = left(@keyjoin,len(@keyjoin)- 5)

--print @keyjoin
--set @msg = @keyjoin; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

-- end of procedure

set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name



if @triggers_exist = 'Y'
   begin
      set @msg = '-- ENABLE TRIGGERS IN CASE THEY WERE DISABLED '  ; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
      set @msg = '     alter table dbo.' + @table_name + ' enable trigger all'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
   end

set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = 'GO'; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name
set @msg = ''; exec master.dbo.spCreateAndWriteLinesToFile @msg, @path, @file_name

GO

