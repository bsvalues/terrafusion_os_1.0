
create procedure sp_ScriptAllUniqueConstraints
	@bUseTableList bit = 0
as

set nocount on

	if ( @bUseTableList = 1 )
	begin
		declare curUniques cursor
		for
			select
				t_tables.name,
				si.name,
				t_tables.id as lTableID,
				si.indid as lIndexID,
				si.OrigFillFactor,
				sfg.groupname as szFileGroupName
			from sysobjects as t_uniques
			join sysobjects as t_tables on
				t_uniques.parent_obj = t_tables.id
			join sysindexes as si on
				t_uniques.name = si.name
			join sysfilegroups as sfg on
				si.groupid = sfg.groupid
			where
				t_uniques.xtype = 'UQ' and /* Only unique constraints */
				t_tables.xtype = 'U' and /* Not system tables */
				objectproperty(t_tables.id, 'IsMSShipped') = 0 and
				t_tables.name in (
					select szTableName from #tmp_tables
				)
			order by t_tables.name asc
		for read only
	end
	else
	begin
		declare curUniques cursor
		for
			select
				t_tables.name,
				si.name,
				t_tables.id as lTableID,
				si.indid as lIndexID,
				si.OrigFillFactor,
				sfg.groupname as szFileGroupName
			from sysobjects as t_uniques
			join sysobjects as t_tables on
				t_uniques.parent_obj = t_tables.id
			join sysindexes as si on
				t_uniques.name = si.name
			join sysfilegroups as sfg on
				si.groupid = sfg.groupid
			where
				t_uniques.xtype = 'UQ' and /* Only unique constraints */
				t_tables.xtype = 'U' and /* Not system tables */
				objectproperty(t_tables.id, 'IsMSShipped') = 0
			order by t_tables.name asc
		for read only
	end

	/* For processing the unique constraints cursor */
	declare
		@szTableName sysname,
		@szIndexName sysname,
		@lTableID int,
		@lIndexID smallint,
		@lFillFactor tinyint,
		@szFileGroupName sysname

	/* For processing the unique constraints columns cursor */
	declare @szColumnName sysname

	/* To determine if we must add a comma in our SQL */
	declare @lCount int

	/* SQL for creating a unique constraint */
	declare @szSQL varchar(8000)

	open curUniques
	fetch next from curUniques
	into
		@szTableName,
		@szIndexName,
		@lTableID,
		@lIndexID,
		@lFillFactor,
		@szFileGroupName

	/* For each unique constraint */
	while @@fetch_status = 0
	begin
		/* Begin building SQL */
		set @szSQL =
			'alter table ' + @szTableName + ' add constraint ' +
			@szIndexName + ' unique '
		if @lIndexID = 1
		begin
			set @szSQL = @szSQL + 'clustered ('
		end
		else
		begin
			set @szSQL = @szSQL + 'nonclustered ('
		end

		declare curUQColumns insensitive cursor
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

		open curUQColumns
		fetch next from curUQColumns
		into
			@szColumnName

		set @lCount = 0

		/* For each column */
		while @@fetch_status = 0
		begin
			if @lCount > 0
			begin
				set @szSQL = @szSQL + ', '
			end

			set @lCount = @lCount + 1

			set @szSQL = @szSQL + '[' + @szColumnName + ']'

			fetch next from curUQColumns
			into
				@szColumnName
		end

		close curUQColumns
		deallocate curUQColumns

		/* Finish building SQL */
		set @szSQL = @szSQL + ')'

		if ( @lFillFactor > 0 )
		begin
			set @szSQL = @szSQL + ' with fillfactor = ' + convert(varchar(3), @lFillFactor)
		end
		
		set @szSQL = @szSQL + ' on [primary]'
		--set @szSQL = @szSQL + ' on [' + @szFileGroupName + ']'

		print @szSQL
		print 'go'
		print ''

		fetch next from curUniques
		into
			@szTableName,
			@szIndexName,
			@lTableID,
			@lIndexID,
			@lFillFactor,
			@szFileGroupName
	end

	close curUniques
	deallocate curUniques

set nocount off

GO

