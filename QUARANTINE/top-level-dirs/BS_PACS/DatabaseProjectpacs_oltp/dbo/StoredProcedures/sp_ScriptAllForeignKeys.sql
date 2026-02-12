
create procedure sp_ScriptAllForeignKeys
	@bUseTableList bit = 0,
	@bPrint bit = 1, /* 1 to use the Transact SQL print statement */
	@bInsertTable bit = 0 /* 1 to insert #tmp_dri */
as

set nocount on

	if ( @bInsertTable = 1 )
	begin
		truncate table #tmp_dri
	end

	if ( @bUseTableList = 1 )
	begin
		declare curForeignKeys insensitive cursor
		for
			select
				t_tables.name,
				t_constraints.name,
				sc.constid
			from sysconstraints as sc
			join sysobjects as t_constraints on
				sc.constid = t_constraints.id
			join sysobjects as t_tables on
				sc.id = t_tables.id
			where
				( sc.status & 15 ) = 3 and /* Only foreign key constraints */
				t_tables.xtype = 'U' and /* Not system tables */
				objectproperty(t_tables.id, 'IsMSShipped') = 0 and
				t_tables.name in (
					select szTableName from #tmp_tables
				)
				and not t_constraints.name in('CFK_property_val_udi_parent_prop_id','CFK_owner_owner_id') -- Temporary workaround
			order by
				t_tables.name asc
		for read only
	end
	else
	begin
		declare curForeignKeys insensitive cursor
		for
			select
				t_tables.name,
				t_constraints.name,
				sc.constid
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
	end

	/* For processing the foreign keys cursor */
	declare
		@szTableName sysname,
		@szConstraintName sysname,
		@lConstraintID int

	/* For processing the foreign key columns cursor */
	declare
		@szTableNameReferenced sysname,
		@szColumnNameReferencing sysname,
		@szColumnNameReferenced sysname

	/* To determine if we must add a comma in our SQL */
	declare @lCount int

	/* SQL for creating a foreign key constraint */
	declare
		@szSQL varchar(2048),
		@szSQLFKey varchar(2048),
		@szSQLRKey varchar(2048)

	open curForeignKeys
	fetch next from curForeignKeys
	into
		@szTableName,
		@szConstraintName,
		@lConstraintID

	/* For each foreign key */
	while @@fetch_status = 0
	begin
		/* Begin building SQL */
		set @szSQL =
			'alter table ' + @szTableName + ' add constraint ' +
			@szConstraintName + ' foreign key '

		declare curFKColumns insensitive cursor
		for
			select
				t_tables.name,
				t_fcolumns.name,
				t_rcolumns.name
			from sysforeignkeys as sfk
			join sysobjects as t_tables on
				sfk.rkeyid = t_tables.id
			join syscolumns as t_fcolumns on
				sfk.fkeyid = t_fcolumns.id and
				sfk.fkey = t_fcolumns.colid
			join syscolumns as t_rcolumns on
				sfk.rkeyid = t_rcolumns.id and
				sfk.rkey = t_rcolumns.colid
			where
				sfk.constid = @lConstraintID
			order by
				sfk.keyno asc
		for read only

		open curFKColumns
		fetch next from curFKColumns
		into
			@szTableNameReferenced,
			@szColumnNameReferencing,
			@szColumnNameReferenced

		select
			@lCount = 0,
			@szSQLFKey = '',
			@szSQLRKey = ''

		/* For each column */
		while @@fetch_status = 0
		begin
			if @lCount > 0
			begin
				set @szSQLFKey = @szSQLFKey + ', '
				set @szSQLRKey = @szSQLRKey + ', '
			end

			set @lCount = @lCount + 1

			set @szSQLFKey = @szSQLFKey + '[' + @szColumnNameReferencing + ']'
			set @szSQLRKey = @szSQLRKey + '[' + @szColumnNameReferenced + ']'

			fetch next from curFKColumns
			into
				@szTableNameReferenced,
				@szColumnNameReferencing,
				@szColumnNameReferenced
		end

		close curFKColumns
		deallocate curFKColumns

		/* Finish building SQL */
		set @szSQL =
			@szSQL + '(' + @szSQLFKey + ')' + ' references ' +
			@szTableNameReferenced + '(' + @szSQLRKey + ')'

		if ( objectproperty(@lConstraintID, 'CnstIsDeleteCascade') = 1 )
		begin
			set @szSQL = @szSQL + ' on delete cascade'
		end

		if ( @bPrint = 1 )
		begin
			print @szSQL
			print 'go'
			print ''
		end

		if ( @bInsertTable = 1 )
		begin
			insert #tmp_dri (szDRI) values (@szSQL)
		end

		fetch next from curForeignKeys
		into
			@szTableName,
			@szConstraintName,
			@lConstraintID
	end

	close curForeignKeys
	deallocate curForeignKeys

set nocount off

GO

