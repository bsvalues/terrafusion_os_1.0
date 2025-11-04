
create procedure sp_EnforceNameConvention_UniqueConstraints

as

set nocount on

	declare curUniques cursor
	for
		select
			t_tables.name,
			t_uniques.name,
			t_tables.id,
			si.indid
		from sysobjects as t_uniques
		join sysobjects as t_tables on
			t_uniques.parent_obj = t_tables.id
		join sysindexes as si on
			t_tables.id = si.id and
			t_uniques.name = si.name
		where
			t_uniques.xtype = 'UQ'
		order by
			t_tables.name asc,
			si.indid asc /* Clustered unique indexes first */
	for read only

	/* For processing the cursor */
	declare
		@szTableName sysname,
		@szConstraintName sysname,
		@lTableID int,
		@lIndexID smallint

	/* For processing the index columns cursor */
	declare @szColumnName sysname

	/* SQL for creating an index */
	declare @szOldName varchar(2048)
	declare @szNewName varchar(2048)

	open curUniques
	fetch next from curUniques into @szTableName, @szConstraintName, @lTableID, @lIndexID

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

		set @szNewName = 'CUQ_' + @szTableName

		/* For each column */
		while @@fetch_status = 0
		begin
			set @szNewName = @szNewName + '_' + @szColumnName

			fetch next from curColumns into @szColumnName
		end

		close curColumns
		deallocate curColumns

		exec sp_rename @szConstraintName, @szNewName, 'OBJECT'

		fetch next from curUniques into @szTableName, @szConstraintName, @lTableID, @lIndexID
	end

	close curUniques
	deallocate curUniques

set nocount off

GO

