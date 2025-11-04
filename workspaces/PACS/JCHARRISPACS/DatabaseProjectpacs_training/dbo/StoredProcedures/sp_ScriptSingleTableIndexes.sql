
create procedure sp_ScriptSingleTableIndexes
	@TableName varchar(255),
    @szSQL varchar(8000) output,
    @IncludeNotExistsLogic bit = 1
as

set nocount on


declare curIndexes insensitive cursor
for
	select
		t_tables.name,
		si.name,
		t_tables.id as lTableID,
		si.indid as lIndexID,
		si.OrigFillFactor,
		sfg.groupname as szFileGroupName
	from sysindexes as si
	join sysobjects as t_tables on
		si.id = t_tables.id
	join sysfilegroups as sfg on
		si.groupid = sfg.groupid
	where
		si.indid between 1 and 254 and /* Not a table within sysindexes */
		t_tables.xtype = 'U' and /* Not system tables */
		objectproperty(t_tables.id, 'IsMSShipped') = 0 and
		(si.status & 64) = 0 and /* discovered in sp_helpindex - ask James for more detail */
         t_tables.name = @TableName
		and not si.name in (
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
		) /* Primary key and unique indexes should be created by creating the constraint */

	order by
		si.indid asc /* Clustered indexes first */
for read only


	/* For processing the indexes cursor */
	declare
		@szTableName sysname,
		@szIndexName sysname,
		@lTableID int,
		@lIndexID smallint,
		@lFillFactor tinyint,
		@szFileGroupName sysname

	/* To determine if we must add a comma in the index column list */
	declare @lCount int

	/* For processing the index columns cursor */
	declare @szColumnName sysname
    set @szSQL = ''
	/* SQL for creating an index */

	open curIndexes
	fetch next from curIndexes
	into
		@szTableName,
		@szIndexName,
		@lTableID,
		@lIndexID,
		@lFillFactor,
		@szFileGroupName

	/* For each index */
	while @@fetch_status = 0
	begin
        if @IncludeNotExistsLogic = 1
           begin
			set @szSQL = @szSQL + ' IF NOT EXISTS(SELECT i.name FROM sysindexes i '
					+ ' WHERE  i.id = object_id('''+ @TableName + ''')'
					+ ' and i.name = ''' + @szIndexName + ''')'
					+ '   BEGIN '
           end

		if @lIndexID = 1
		begin
			set @szSQL = @szSQL + 'create clustered index '
		end
		else
		begin
			set @szSQL = @szSQL + 'create nonclustered index '
		end

		set @szSQL = @szSQL + @szIndexName + ' on ' + @szTableName + '('

		declare curColumns insensitive cursor
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
		fetch next from curColumns
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

			fetch next from curColumns
			into
				@szColumnName
		end

		close curColumns
		deallocate curColumns

		/* Finish building SQL */
		set @szSQL = @szSQL + ')'

		if ( @lFillFactor > 0 )
		begin
			set @szSQL = @szSQL + ' with fillfactor = ' + convert(varchar(3), @lFillFactor) + '  '
		end

        if @IncludeNotExistsLogic = 1
           begin
              set @szSQL = @szSQL +'   END '
		   end
		--set @szSQL = @szSQL + ' on [primary]  '
		--set @szSQL = @szSQL + ' on [' + @szFileGroupName + ']'

	--	print @szSQL
		--print 'go'
		--print ''

		fetch next from curIndexes
		into
			@szTableName,
			@szIndexName,
			@lTableID,
			@lIndexID,
			@lFillFactor,
			@szFileGroupName
	end

	close curIndexes
	deallocate curIndexes

set nocount off

GO

