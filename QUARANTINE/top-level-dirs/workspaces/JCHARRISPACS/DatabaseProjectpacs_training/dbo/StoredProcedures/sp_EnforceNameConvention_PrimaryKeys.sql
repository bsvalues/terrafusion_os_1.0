
create procedure sp_EnforceNameConvention_PrimaryKeys

as

set nocount on

	declare curPrimaryKeys cursor
	for
		select
			t_tables.name,
			si.name
		from sysobjects as t_primarykeys
		join sysobjects as t_tables on
			t_primarykeys.parent_obj = t_tables.id
		join sysindexes as si on
			t_primarykeys.name = si.name
		where
			t_primarykeys.xtype = 'PK' and /* Only primary key constraints */
			t_tables.xtype = 'U' /* Not system tables */
		order by t_tables.name asc
	for read only

	/* For processing the primary keys cursor */
	declare
		@szTableName sysname,
		@szIndexName sysname

	declare @szNewName varchar(2048)

	open curPrimaryKeys
	fetch next from curPrimaryKeys into @szTableName, @szIndexName

	/* For each primary key */
	while @@fetch_status = 0
	begin
		set @szNewName = 'CPK_' + @szTableName
		exec sp_rename @szIndexName, @szNewName, 'OBJECT'

		fetch next from curPrimaryKeys into @szTableName, @szIndexName
	end

	close curPrimaryKeys
	deallocate curPrimaryKeys

set nocount off

GO

