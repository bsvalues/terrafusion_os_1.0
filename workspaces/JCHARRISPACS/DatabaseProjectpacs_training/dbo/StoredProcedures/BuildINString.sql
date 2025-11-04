

create procedure BuildINString
	@sz varchar(8000) output
as

set nocount on

	set @sz = '''' + @sz + ''''

	set @sz = replace(@sz, ',', ''', ''')

set nocount off

GO

