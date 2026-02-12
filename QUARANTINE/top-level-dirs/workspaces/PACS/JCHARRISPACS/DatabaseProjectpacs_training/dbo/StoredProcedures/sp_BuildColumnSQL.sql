
create procedure sp_BuildColumnSQL
	@szSQL varchar(2048) output,
	@szColumnName sysname,
	@szDataType sysname,
	@iLength smallint,
	@iPrecision smallint,
	@lScale int,
	@lNullable int
as

set nocount on

	set @szSQL = '[' + @szColumnName + '] ' + @szDataType

	if (
		@szDataType = 'char' or
		@szDataType = 'varchar' or
		@szDataType = 'binary' or
		@szDataType = 'varbinary' or
		@szDataType = 'nchar' or
		@szDataType = 'nvarchar'
	)
	begin
		set @szSQL = @szSQL + '(' + convert(varchar(16), @iLength) + ')'
	end
	else if (
		@szDataType = 'numeric' or
		@szDataType = 'decimal'
	)
	begin
		set @szSQL = @szSQL + '(' + convert(varchar(16), @iPrecision) + ',' + convert(varchar(16), @lScale) + ')'
	end
	else if ( @szDataType = 'float' )
	begin
		set @szSQL = @szSQL + '(' + convert(varchar(16), @iPrecision) + ')'
	end

	if ( @lNullable = 0 )
	begin
		set @szSQL = @szSQL + ' not'
	end
	
	set @szSQL = @szSQL + ' null'

set nocount off

GO

