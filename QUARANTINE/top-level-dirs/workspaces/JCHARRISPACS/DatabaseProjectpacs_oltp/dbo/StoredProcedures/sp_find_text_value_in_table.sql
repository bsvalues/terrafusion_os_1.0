


create PROCEDURE [dbo].[sp_find_text_value_in_table]

	@input_table_name varchar(100),
	@input_search_string varchar(200)

AS

declare @column_name varchar(100),
	@query varchar(8000)

declare cur_column_name cursor for
	select name
	from syscolumns where id = object_id(@input_table_name)
		and xtype in (select xtype from systypes where name in ('char', 'nchar', 'ntext', 'nvarchar', 'text', 'varchar'))

open cur_column_name
fetch next from cur_column_name into @column_name

while @@fetch_status = 0
begin
	set @query =  'if exists (select * from ' + @input_table_name + ' where ' + @column_name + ' like ''%' + @input_search_string + '%'') '
			+ 'begin print ''' + 'select * from ' + @input_table_name + ' where ' + @column_name + ' like ''''%'  + @input_search_string + '%'''''' end'

	--print @query

	execute(@query) 

	fetch next from cur_column_name into @column_name
end

close cur_column_name
deallocate cur_column_name

GO

