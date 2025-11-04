
create procedure sp_EnforceNameConvention_ForeignKeys

as

set nocount on

	create table #try_after
	(
		old_name sysname not null,
		new_name sysname not null
	)
	
	declare curForeignKeys cursor
	for
		select
			t_tables.name,
			t_constraints.name,
			sc.constid
		from sysconstraints as sc
		join sysobjects as t_constraints on
			sc.constid = t_constraints.id and
			t_constraints.xtype = 'F'
		join sysobjects as t_tables on
			sc.id = t_tables.id and
			t_tables.xtype = 'U'
		order by
			t_tables.name asc
	for read only

	/* For processing the foreign keys cursor */
	declare
		@szTableName sysname,
		@szConstraintName sysname,
		@lConstraintID int

	/* For processing the foreign key columns cursor */
	declare @szColumnNameReferencing sysname

	declare @szNewName varchar(2048)

	open curForeignKeys
	fetch next from curForeignKeys
	into
		@szTableName,
		@szConstraintName,
		@lConstraintID

	/* For each foreign key */
	while @@fetch_status = 0
	begin
		declare curFKColumns cursor
		for
			select
				t_fcolumns.name
			from sysforeignkeys as sfk
			join syscolumns as t_fcolumns on
				sfk.fkeyid = t_fcolumns.id and
				sfk.fkey = t_fcolumns.colid
			where
				sfk.constid = @lConstraintID
			order by
				sfk.keyno asc
		for read only

		open curFKColumns
		fetch next from curFKColumns into @szColumnNameReferencing

		set @szNewName = 'CFK_' + @szTableName

		/* For each column */
		while @@fetch_status = 0
		begin
			set @szNewName = @szNewName + '_' + @szColumnNameReferencing

			fetch next from curFKColumns into @szColumnNameReferencing
		end

		close curFKColumns
		deallocate curFKColumns

		if ( @szConstraintName <> @szNewName )
		begin
			if object_id(@szNewName) is null
			begin
				print @szConstraintName + '  ::::  ' + @szNewName
				exec sp_rename @szConstraintName, @szNewName, 'OBJECT'
			end
			else
			begin
				insert #try_after (old_name, new_name)
				values (@szConstraintName, @szNewName)
			end
		end

		fetch next from curForeignKeys
		into
			@szTableName,
			@szConstraintName,
			@lConstraintID
	end

	close curForeignKeys
	deallocate curForeignKeys

	declare curTry cursor
	for
		select old_name, new_name
		from #try_after
	for read only
	
	open curTry
	fetch next from curTry into @szConstraintName, @szNewName
	
	while (@@fetch_status = 0)
	begin
		exec sp_rename @szConstraintName, @szNewName, 'OBJECT'
		
		fetch next from curTry into @szConstraintName, @szNewName
	end
	
	close curTry
	deallocate curTry

GO

