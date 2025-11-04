
create procedure sp_ScriptAllTables
	@bUseTableList bit = 0
as

set nocount on

	declare
		@szTableSQL1 varchar(8000),
		@szTableSQL2 varchar(8000),
		@szTableName sysname

	if ( @bUseTableList = 1 )
	begin
		declare curTables cursor
		for
			select name
			from sysobjects
			where xtype = 'U' and
			objectproperty(id, 'IsMSShipped') = 0 and
			name in (
				select szTableName from #tmp_tables
			)
			order by name asc
		for read only
	end
	else
	begin
		declare curTables cursor
		for
			select name
			from sysobjects
			where xtype = 'U' and
			objectproperty(id, 'IsMSShipped') = 0
			order by name asc
		for read only
	end

	open curTables
	fetch next from curTables into @szTableName

	while ( @@fetch_status = 0 )
	begin
		exec sp_ScriptTable @szTableName, @szTableSQL1 output, @szTableSQL2 output

		print @szTableSQL1
		print @szTableSQL2
		print 'go'
		print ''

		fetch next from curTables into @szTableName
	end

	close curTables
	deallocate curTables

set nocount off

GO

