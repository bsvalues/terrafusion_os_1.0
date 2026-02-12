
create procedure sp_DropAllForeignKeys

as

	declare curForeignKeys insensitive cursor
	for
		select
			t_tables.name,
			t_constraints.name
		from sysconstraints as sc
		join sysobjects as t_constraints on
			sc.constid = t_constraints.id
		join sysobjects as t_tables on
			sc.id = t_tables.id
		where
			( sc.status & 15 ) = 3 and /* Only foreign key constraints */
			t_tables.xtype = 'U' and /* Not system tables */
			objectproperty(t_tables.id, 'IsMSShipped') = 0
		order by
			t_tables.name asc
	for read only

	declare
		@szTableName sysname,
		@szConstraintName sysname,
		@szSQL varchar(8000)

	open curForeignKeys
	fetch next from curForeignKeys into @szTableName, @szConstraintName

	/* For each foreign key */
	while @@fetch_status = 0
	begin
		set @szSQL = 'alter table ' + @szTableName + ' drop constraint ' + @szConstraintName
		exec(@szSQL)

		open curForeignKeys
		fetch next from curForeignKeys into @szTableName, @szConstraintName
	end

	close curForeignKeys
	deallocate curForeignKeys

GO

