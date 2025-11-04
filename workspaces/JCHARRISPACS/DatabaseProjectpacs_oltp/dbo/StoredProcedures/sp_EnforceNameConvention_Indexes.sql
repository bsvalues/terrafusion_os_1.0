
create procedure sp_EnforceNameConvention_Indexes

as

set nocount on

	declare curIndexes cursor
	for
		select
			t_tables.name,
			si.name,
			t_tables.id as lTableID,
			si.indid as lIndexID
		from sysindexes as si
		join sysobjects as t_tables on
			si.id = t_tables.id
		where
			si.indid between 1 and 254 and /* Not a table within sysindexes */
			t_tables.xtype = 'U' and /* Not system tables */
			(si.status & 64) = 0 and /* discovered in sp_helpindex - ask James for more detail */
			not si.name in (
				select
					t_constraints.name
				from sysconstraints as sc
				join sysobjects as t_constraints on
					sc.constid = t_constraints.id
				join sysobjects as t_tables on
					sc.id = t_tables.id
				where
					t_tables.xtype = 'U' and /* Not system tables */
					(sc.status & 15) in (1, 2) /* Only primary key and unique constraints */
			) /* Primary key and unique indexes should be renamed per their own convention */
		order by
			t_tables.name asc,
			si.indid asc /* Clustered indexes first */
	for read only

	/* For processing the indexes cursor */
	declare
		@szTableName sysname,
		@szIndexName sysname,
		@lTableID int,
		@lIndexID smallint

	/* For processing the index columns cursor */
	declare @szColumnName sysname

	/* SQL for creating an index */
	declare @szOldName varchar(2048)
	declare @szNewName varchar(2048)

	open curIndexes
	fetch next from curIndexes into @szTableName, @szIndexName, @lTableID, @lIndexID

	/* For each index */
	while @@fetch_status = 0
	begin
		declare curColumns cursor
		for
			select
				sc.name
			from sysindexkeys as sik
			join syscolumns as sc on
				sik.id = sc.id and
				sik.colid = sc.colid
			where
				sik.id = @lTableID and
				sik.indid = @lIndexID
			order by
				sik.keyno asc
		for read only

		open curColumns
		fetch next from curColumns into @szColumnName

		set @szNewName = 'idx'

		/* For each column */
		while @@fetch_status = 0
		begin
			set @szNewName = @szNewName + '_' + @szColumnName

			fetch next from curColumns into @szColumnName
		end

		close curColumns
		deallocate curColumns

		set @szOldName = @szTableName + '.' + @szIndexName

		exec sp_rename @szOldName, @szNewName, 'INDEX'

		fetch next from curIndexes into @szTableName, @szIndexName, @lTableID, @lIndexID
	end

	close curIndexes
	deallocate curIndexes

set nocount off

GO

