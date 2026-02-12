
create procedure dbo.usp_find_column
	@SearchFor sysname
as

SET NOCOUNT ON

declare @column_requested sysname
    set @column_requested = '%' + @SearchFor + '%'

select  
c.table_catalog as database_name,
c.table_schema,
c.table_name,

c.COLUMN_NAME as column_name 
,IsIdentity = case when  COLUMNPROPERTY(OBJECT_ID(t.table_name), c.COLUMN_NAME, 'IsIdentity') = 1 
                then 'Identity'
                else ''
              end

,col_definition =
       case data_type 
         when  'varchar' then data_type + ' (' + case when  CHARACTER_MAXIMUM_LENGTH  < 0 then 'MAX' else convert(varchar(100),CHARACTER_MAXIMUM_LENGTH) end   + ')'
         when  'char'   then data_type + ' (' + convert(varchar(100),CHARACTER_MAXIMUM_LENGTH)  + ')'
         when  'nvarchar' then data_type + ' (' + case when  CHARACTER_MAXIMUM_LENGTH  < 0 then 'MAX' else convert(varchar(100),CHARACTER_MAXIMUM_LENGTH) end   + ')'
         when  'numeric' then data_type + ' (' + convert(varchar(40),NUMERIC_PRECISION) + ',' + convert(varchar(40),NUMERIC_SCALE)  + ')'
         when  'money' then data_type + ' (' + convert(varchar(40),NUMERIC_PRECISION) + ',' + convert(varchar(40),NUMERIC_SCALE)  + ')'
         else data_type --timestamp,image,xml,int, smallint,datetime,uniqueidentifier,tinyint,smalldatetime,float,real,bigint,bit

       end 
,default_value = ISNULL(COLUMN_DEFAULT,'') 
,allow_nulls=case IS_NULLABLE when  'YES' then 'Nulls Allowed' else 'Not Null' end


FROM INFORMATION_SCHEMA.TABLES as t 
     inner join  
     INFORMATION_SCHEMA.COLUMNS as c 
  ON t.table_name = c.table_name 
 and t.table_schema = c.table_schema
  
 WHERE  t.table_type = 'BASE TABLE'
   AND c.COLUMN_NAME Like @column_requested 

 ORDER BY t.table_name, c.COLUMN_NAME

GO

