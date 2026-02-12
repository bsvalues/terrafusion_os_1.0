
create procedure sp_ScriptAllDefaultConstraints
	@bUseTableList bit = 0,
	@bShowUpdateSQL bit = 0
as

set nocount on

	declare
		@szTable sysname,
		@szConstraintName sysname,
		@lConstraintID int,
		@lTableID int,
		@lColumnID smallint

	declare @szColumnName sysname
	declare @szConstraintDefinition varchar(8000)
	declare @szSQL varchar(8000)

	create table #tmp_updates
	(
		lID int identity(1,1) not null,
		szSQL varchar(8000) not null
	)

	if ( @bUseTableList = 1 )
	begin
		declare curDefaults cursor
		for
			select st.name, so.name, sc.constid, sc.id, sc.colid
			from sysconstraints as sc
			join sysobjects as so on
				sc.constid = so.id
			join sysobjects as st on
				sc.id = st.id
			where ( sc.status & 15 ) = 5 and
			st.xtype = 'U' and
			objectproperty(st.id, 'IsMSShipped') = 0 and
			st.name in (
				select szTableName from #tmp_tables
			)
			order by st.name asc, sc.colid asc
		for read only
	end
	else
	begin
		declare curDefaults cursor
		for
			select st.name, so.name, sc.constid, sc.id, sc.colid
			from sysconstraints as sc
			join sysobjects as so on
				sc.constid = so.id
			join sysobjects as st on
				sc.id = st.id
			where ( sc.status & 15 ) = 5 and
			st.xtype = 'U' and
			objectproperty(st.id, 'IsMSShipped') = 0
			order by st.name asc, sc.colid asc
		for read only
	end

	open curDefaults
	fetch next from curDefaults into @szTable, @szConstraintName, @lConstraintID, @lTableID, @lColumnID

	while ( @@fetch_status = 0 )
	begin
		/* Get the column name */
		select @szColumnName = name
		from syscolumns
		where
			id = @lTableID and
			colid = @lColumnID

		/* Get the default constraint definition from syscomments */
		set @szConstraintDefinition = null
		select @szConstraintDefinition = convert(varchar(8000), text)
		from syscomments
		where
			id = @lConstraintID

		if ( @szConstraintDefinition is null )
		begin
			print '/* No entry in syscomments for default constraint ' + @szConstraintName + ' on table ' + @szTable + '*/'
		end
		else
		begin
			set @szSQL = 'alter table ' + @szTable + ' add constraint ' + @szConstraintName + ' default ' + @szConstraintDefinition + ' for [' + @szColumnName + ']'
			print @szSQL
			print 'go'
			print ''

			set @szSQL = 'if exists (select id from syscolumns where id = object_id(''' + @szTable + ''') and name = ''' + @szColumnName + ''') begin update ' + @szTable + ' set ' + @szColumnName + ' = ' + @szConstraintDefinition + ' where ' + @szColumnName + ' is null end'
			insert #tmp_updates (szSQL) values ( @szSQL )
		end
		
		fetch next from curDefaults into @szTable, @szConstraintName, @lConstraintID, @lTableID, @lColumnID
	end

	close curDefaults
	deallocate curDefaults

	if ( @bShowUpdateSQL = 1 )
	begin
		declare curUpdates cursor
		for
			select szSQL
			from #tmp_updates
			order by lID asc
		for read only

		open curUpdates
		fetch next from curUpdates into @szSQL
		
		while ( @@fetch_status = 0 )
		begin
			print @szSQL

			fetch next from curUpdates into @szSQL
		end

		close curUpdates
		deallocate curUpdates
	end

set nocount off

GO

