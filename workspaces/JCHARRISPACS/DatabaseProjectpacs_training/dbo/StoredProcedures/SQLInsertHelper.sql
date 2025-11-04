

CREATE PROCEDURE SQLInsertHelper

@table_name	varchar(255),
@mode		varchar(1) = 'I'--C = Copy from one year to another
							--I = Simple insert construction

AS

declare @column_name 	varchar(255)
declare @year_name 		varchar(255)
declare @bYearNameSet	bit
declare @nColumnCount	int
declare @nCount			int

set @bYearNameSet 	= 0
set @nColumnCount	= 0
set @nCount		 	= 1

select @nColumnCount = count(*) from syscolumns where id = object_id(@table_name)
						and status not in (128) --Exclude identity columns
						and xtype not in (189) --Exclude TIMESTAMP columns

DECLARE SQLHELPER SCROLL CURSOR
FOR select rtrim(name)
from syscolumns
where id = object_id(@table_name)
	and status not in (128) --Exclude identity columns
	and xtype not in (189) --Exclude TIMESTAMP columns
order by colorder

OPEN SQLHELPER
FETCH NEXT FROM SQLHELPER into @column_name

print 'insert into ' + @table_name
print '('

WHILE (@@FETCH_STATUS = 0)
BEGIN
	print char(9) + @column_name + case when (@nCount = @nColumnCount) then '' else ',' end

	FETCH NEXT FROM SQLHELPER into @column_name

	set @nCount = @nCount + 1
END

print ')'
print 'select'

set @nCount = 1

FETCH FIRST FROM SQLHELPER into @column_name

if (@mode = 'C')
begin
	WHILE (@@FETCH_STATUS = 0)
	BEGIN
		if @column_name in ('owner_tax_yr', 'prop_val_yr', 'sup_yr', 'tax_yr', 'shared_year', 'income_yr')
		begin
			if (@bYearNameSet = 0)
			begin
				set @year_name	 	= @column_name
				set @bYearNameSet 	= 1
			end
	
			set @column_name = '@input_to_year'		
		end
	
		print char(9) + @column_name + case when (@nCount = @nColumnCount) then '' else ',' end
	
		FETCH NEXT FROM SQLHELPER into @column_name
	
		set @nCount = @nCount + 1
	END
	
	print 'from ' + @table_name
	print 'where ' + replace(@year_name, ',', '') + ' = @input_from_year'
end
else if (@mode = 'I')
begin
	WHILE (@@FETCH_STATUS = 0)
	BEGIN
		print char(9) + @column_name + case when (@nCount = @nColumnCount) then '' else ',' end
	
		FETCH NEXT FROM SQLHELPER into @column_name
	
		set @nCount = @nCount + 1
	END

	print 'from ' + @table_name
end

print ''

CLOSE SQLHELPER
DEALLOCATE SQLHELPER

GO

