
-- exec dbo.GetTableInfo 'property'

CREATE PROCEDURE dbo.GetTableInfo

  @table_requested varchar(400),
  @display_column_order int = 2, --2 ='Column Name Alpha' or 1 ='Database Order',
  @table_owner sysname = 'dbo' -- default table owner/schema

AS

set nocount on


DECLARE @CRLF VARCHAR(2)
    SET @CRLF = CHAR(13) + CHAR(10) -- to help format dynamic sql for debugging

declare @full_table_name varchar(776)
    set @full_table_name = @table_owner + '.' + @table_requested


declare @table_schema VARCHAR(128)

declare @Rows int
declare @count_tables table
 (TABLE_SCHEMA nvarchar(128), TABLE_NAME sysname)

-- check for table existence
insert into @count_tables
      (TABLE_SCHEMA, TABLE_NAME)
select TABLE_SCHEMA, TABLE_NAME
 from INFORMATION_SCHEMA.TABLES 
where TABLE_NAME = @table_requested

set @Rows = @@ROWCOUNT

if exists(select * from @count_tables where TABLE_SCHEMA = @table_owner )
   begin
		if @Rows > 1
		   begin
			 select 'Multiple Tables with this name exist. Info returned is for:' as Table_Schema,
					@full_table_name as Table_Name
			  UNION ALL
			 select TABLE_SCHEMA, TABLE_NAME 
			   from @count_tables
		   end  
   end
else
   begin
      RAISERROR('Table %s does not exists in this database.' , 0, 1,@full_table_name) WITH NOWAIT
      return -1
   end

declare @databasename varchar(128)
    set @databasename = db_name()

declare @ver varchar(10)
declare @sqltext  varchar(8000)

select @ver = case
                when  CHARINDEX('9.00', @@VERSION) > 0 THEN '2005'
                when  CHARINDEX('8.00', @@VERSION) > 0 THEN '2000'
                else '2005' -- no clients are lower than 2000, default to 2005
              end  

-- get quick rowcount and size for table
-- name,rows,reserved,data,index_size,unused
create table #row_space_info
(
    table_name varchar(256) NOT NULL ,
    total_rows BigInt,
    reserved_space varchar(20),
    data_space varchar(20),
    index_space varchar(20),
    unused_space varchar(20)
)

exec ('INSERT INTO #row_space_info
       EXEC sp_spaceused  ''' + @full_table_name + '''' )


create table #index_cols
(
    index_name varchar(255),
    index_description varchar(1000),
    index_keys varchar(4000)
)

-- get index info for table
exec ('INSERT INTO #index_cols
       EXEC sp_helpindex  ''' + @full_table_name + '''' )

--now get space used by each index
--this will also get temp indexes (_WA) so exclude those in results.

create table #index_space
(
    index_id int,
    index_name varchar(255),
    index_size_KB bigint,
    index_comments varchar(4000)
)

-- get index space for table
exec ('INSERT INTO #index_space
       EXEC sp_MSindexspace  ''' + @full_table_name + '''' )

-- get info on check constraints involving this table
create table #check_constraints
(
 constraint_name sysname,
 constraint_type varchar(400),
 status_enabled varchar(200),
 status_for_replication varchar(200),
 [constraint] varchar(8000),
 column_name sysname null
)

set @sqltext = 'insert into #check_constraints ' + @CRLF
             + '  exec dbo.GetCheckConstraintInfoForTable  ''' + @table_requested + ''',''' + @table_owner + ''''

--print @sqltext

exec (@sqltext)


create table #table_definition
(
    table_name varchar(128) NULL,
    table_description varchar(4000) NULL,
) 

if @ver = '2000'
   begin
	set @sqltext = 'INSERT INTO #table_definition ' + @CRLF
	+ ' select  objname,  cast(value as varchar(4000)) ' + @CRLF
	+ ' FROM ::fn_listextendedproperty (NULL, ''user'', ''' + @table_owner + ''', ''table'', ''' + @table_requested + ''', NULL, NULL)'

   end
else
   begin
	set @sqltext = 'INSERT INTO #table_definition ' + @CRLF
	+ ' select  objname,  cast(value as varchar(4000)) '  + @CRLF
	+ ' FROM fn_listextendedproperty (NULL, ''schema'',''' + @table_owner + ''', ''table'', ''' + @table_requested + ''', NULL, NULL)'
   end
--print @sqltext

exec (@sqltext)


if not exists(select 1 from #table_definition)
   begin
     -- table does not have a description, so insert dummy record into temp table
    insert into #table_definition (table_name) values (@table_requested)
  end

create table #data_dictionary(
[table_schema] varchar(128) NULL,
[table_name] varchar(128) NULL,
[column_name] varchar(128) NULL,
[xtype] varchar(8) NULL,
[description] nvarchar(4000) NULL,
ordinal_position int null
) 



if @ver = '2000'
   begin
	set @sqltext = 'INSERT INTO #data_dictionary ([table_schema],[table_name], [column_name],[description], [xtype]) select ' 
	+ '''' + @table_owner + ''',''' + @table_requested + ''', objname, cast(value as  varchar(4000)), ''U'' FROM '
	+ '::fn_listextendedproperty (NULL, ''user'', ' 
    + '''' + @table_owner + ''''+ ', ''table'',' + '''' + @table_requested + '''' + ', ''column'', NULL)'

   end
else
   begin
	set @sqltext = 'INSERT INTO #data_dictionary ([table_schema],[table_name], [column_name],[description], [xtype]) select ' 
	+ '''' + @table_owner + ''',''' +@table_requested  + ''', objname, cast(value as nvarchar(4000)), ''U'' FROM '
	+ @databasename + '.sys.fn_listextendedproperty (NULL, ''schema'', ' 
    + '''' + @table_owner + ''''+ ', ''table'',' + '''' + @table_requested + '''' + ', ''column'', NULL)'
   end


--print @sqltext
EXECUTE(@sqltext)


create table #data_dictionary_keys(
[table_schema] varchar(128) NULL,
[table_name] varchar(128) NULL,
[column_name] varchar(128) NULL,
[xtype] varchar(8) NULL

) 

 
-- Populate all the  Primary Key and Foreign keys

INSERT INTO #data_dictionary_keys 
select U.TABLE_SCHEMA,U.TABLE_NAME, U.COLUMN_NAME, xtype 
FROM INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE U 
JOIN sysobjects O 
ON U.CONSTRAINT_NAME = O.name WHERE O.xtype in ('F','PK')
AND U.TABLE_NAME =  @table_requested 



create table #data_dictionary_cc(
table_schema  varchar(128) NULL,
table_name  varchar(128) NULL,
column_name  varchar(128) NULL,
is_computed bit null,
computed_col_definition varchar(1000) NULL
)
-- populate computed column definitions
INSERT INTO #data_dictionary_cc 
 select  
 	user_name(o.uid) as table_schema, 
      o.name, 
     sc.name ,
     sc.iscomputed, 
     convert(varchar(1000), text) as computedcol_definition  
FROM syscolumns as sc 
JOIN systypes as st 
 	on 	sc.xtype = st.xtype and 
 		sc.xusertype = st.xusertype  
JOIN syscomments c 
        on sc.id = c.id 
         and sc.colid = c.number 
JOIN sysobjects o 
         on sc.id = o.id 
 		where o.type = 'U' and sc.iscomputed = 1 
           and o.name = @table_requested 
 		order by  o.name,sc.name 


update D
   set D.[xtype] = K.[xtype]
  from #data_dictionary as D 
       JOIN 
       #data_dictionary_keys as K
     on D.table_schema = K.table_schema 
    AND D.table_name = K.table_name 
    AND isnull(D.column_name,'') = isnull(K.column_name,'')


create table #pacs_version (version varchar(20))
set @sqltext = 'IF object_id(''' + @databasename + '.dbo.pacs_system''' + ') is not null ' + @CRLF
           + ' INSERT INTO #pacs_version select top 1 version from ' + @databasename + '.dbo.pacs_system'

--print @sqltext
exec(@sqltext)

declare @i int
select @i = (select dbo.fn_IsTableReplicated(@table_requested))

select pacs_version = isnull((select top 1 version from #pacs_version),'None')
      ,td.table_name
      ,is_replicated = case @i when  1 then 'Replicated' else 'Not Replicated' end
      ,s.total_rows
      ,s.reserved_space
      ,s.data_space
      ,s.index_space
      ,s.unused_space
      ,td.table_description
 from #table_definition as td
      join 
      #row_space_info as s
   on td.table_name = s.table_name

select  

QUOTENAME(c.COLUMN_NAME) as column_name 
,IsIdentity = case when  COLUMNPROPERTY(OBJECT_ID(@table_requested), c.COLUMN_NAME, 'IsIdentity') = 1 then 'Identity'
                   else ''
              end
,IsPrimaryKey = isnull((select top 1 case  xtype
						  when  'PK' then 'PK'
						  else ''
                        end
                      from  #data_dictionary_keys
                    where table_name = @table_requested and column_name = c.COLUMN_NAME and xtype = 'PK'
                ),'') 
,IsForeignKey = isnull((select top 1 case  xtype
						  when  'F' then 'FK'
						  else 'No'
                        end
                      from  #data_dictionary_keys
                    where table_name = @table_requested and column_name = c.COLUMN_NAME and xtype = 'F'
                ),'') 

,col_definition =
       case data_type 
         when  'varchar' then data_type + ' (' + case when  CHARACTER_MAXIMUM_LENGTH  < 0 then 'MAX' else convert(varchar(100),CHARACTER_MAXIMUM_LENGTH) end   + ')'
         when  'varbinary' then data_type + ' (' + case when  CHARACTER_MAXIMUM_LENGTH  < 0 then 'MAX' else convert(varchar(100),CHARACTER_MAXIMUM_LENGTH) end   + ')'
         when  'char'   then data_type + ' (' + convert(varchar(100),CHARACTER_MAXIMUM_LENGTH)  + ')'
         when  'nvarchar' then data_type + ' (' + case when  CHARACTER_MAXIMUM_LENGTH  < 0 then 'MAX' else convert(varchar(100),CHARACTER_MAXIMUM_LENGTH) end   + ')'
         when  'numeric' then data_type + ' (' + convert(varchar(40),NUMERIC_PRECISION) + ',' + convert(varchar(40),NUMERIC_SCALE)  + ')'
         when  'money' then data_type + ' (' + convert(varchar(40),NUMERIC_PRECISION) + ',' + convert(varchar(40),NUMERIC_SCALE)  + ')'
         else data_type --timestamp,image,xml,int, smallint,datetime,uniqueidentifier,tinyint,smalldatetime,float,real,bigint,bit

       end 
,default_value = ISNULL(COLUMN_DEFAULT,'') 
,allow_nulls=case IS_NULLABLE when  'YES' then 'Nulls Allowed' else 'Not Null' end
, computed_col  =
    case isnull(cc.is_computed,0) 
      when  0 Then ''
      else cc.computed_col_definition 
    end  
,isnull(k.[constraint],'') as column_constraint
,c.ordinal_position as database_column_order 
,isnull(d.description,'') as col_description  

into #colHold
FROM INFORMATION_SCHEMA.TABLES as t 
     inner join  
     INFORMATION_SCHEMA.COLUMNS as c 
  ON t.table_name = c.table_name 
 and t.table_schema = c.table_schema
     left join 
     #data_dictionary as d  
  on c.table_name = d.table_name 
 AND c.COLUMN_NAME = d.column_name 
     left join 
     #data_dictionary_cc as cc 
  ON c.table_name = cc.table_name   
 AND c.COLUMN_NAME  = cc.column_name 
     left join
     #check_constraints as k
  on c.COLUMN_NAME = k.column_name
  
 WHERE  t.table_type = 'BASE TABLE'
   AND t.table_name = @table_requested 
   AND t.table_schema = @table_owner


if @display_column_order = 1
   begin
     select * from #colHold
     ORDER BY database_column_order
   end
else
   begin
     select * from #colHold
     ORDER BY column_name
   end

select c.index_name
      ,c.index_keys as index_columns
      ,c.index_description as index_type
      ,s.index_size_KB
      ,comments = case s.index_comments 
                      when   '(None)' then ''
                      else s.index_comments
                    end
 from #index_cols as c
      left join
      #index_space as s
   on c.index_name = s.index_name


-- get trigger information
 select trigger_name,trigger_status,trigger_event
 from dbo.fn_GetTriggerInfoForATable(@table_requested,@table_owner) 
order by trigger_event, trigger_name

-- foreign keys referencing this table

select ReferenceType,fk_name,fk_col,referenced_col 
from dbo.fn_GetForeignKeyInfoForATable(@table_requested,@table_owner)
ORDER BY ReferenceType,fk_name



-- return all check constraint info
select  
       constraint_name ,
       constraint_type ,
       status_enabled,
       status_for_replication ,
       [constraint] 
  from #check_constraints
order by constraint_type,constraint_name


DROP TABLE #data_dictionary

DROP TABLE #data_dictionary_keys

DROP TABLE #data_dictionary_cc

DROP TABLE #pacs_version

drop table #table_definition
drop table #row_space_info
drop table #index_cols
drop table #index_space

GO

