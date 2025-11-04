create PROCEDURE backup_table

	@table varchar(100),
	@name varchar(100) =''
AS
BEGIN

	SET NOCOUNT ON;

-- make sure ta_support database exists

if DB_ID('ta_support') is null
begin
create database ta_support
end
-- check that source table exists

if object_ID(@table) is null
begin
print 'Table does not exist.'
return
end

--backup table

declare @destination varchar(max)
declare @sql varchar(max)

set @destination=replace(replace(@table+'_'+convert(varchar(50),GETDATE(),109)+'_'+@name,' ','_'),':','')

set @sql='select * into ta_support.dbo.'+@destination+'
from '+@table


exec (@sql)

-- display results

print cast(@@rowcount as varchar (50)) +' rows backed up.'
print 'This select will return your backed up data;'
print 'select * from ta_support.dbo.'+@destination



END

GO

