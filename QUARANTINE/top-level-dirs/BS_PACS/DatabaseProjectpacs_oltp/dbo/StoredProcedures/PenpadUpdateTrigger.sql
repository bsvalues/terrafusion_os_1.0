


create procedure PenpadUpdateTrigger
	@szTableName sysname
as

	/*
		Even though a table must have a primary key defined in order for
		this trigger to track it, we do not check for said primary key
		since triggers are only created for tables with primary keys.
		This is handled in the penpad database creation in the PACS app.
	*/

set nocount on

	if ( (select count(*) from #inserted) = 0 ) or ( (select count(*) from #deleted) = 0 )
	begin
		/* It does happen */
		return(0)
	end

	declare
		@szColumnName sysname,
		@szColumnDataType sysname,
		@szSQL varchar(2048),
		@szWhere varchar(2048),
		@lIndex int,
		@bQuote bit,
		@szKeys varchar(512),
		@szKey varchar(512),
		@lPropID int,
		@szPIDColumnName varchar(255)

	declare @lRunID int
	declare @dtChange datetime
	declare @szOldValue varchar(512)
	declare @szNewValue varchar(512)
	declare @lDummy int

	select @lRunID = run_id
	from penpad_run with(nolock)

	set @dtChange = getdate()

	select
		@szPIDColumnName = szPIDColumnName
	from penpad_db_objects
	where
		szObjectName = @szTableName and
		szObjectType = 'U'

	create table #tmp_value
	(
		szValue varchar(512) null
	)

	declare curRows1 cursor
	for
		select convert(int, 0)
		from #inserted
	for update

	declare curRows2 cursor
	for
		select convert(int, 0)
		from #deleted
	for update

	open curRows1
	open curRows2
	fetch next from curRows1 into @lDummy
	fetch next from curRows2 into @lDummy

	while ( @@fetch_status = 0 )
	begin
		select top 1 *
		into #inserted_row
		from #inserted

		select top 1 *
		into #deleted_row
		from #deleted

		delete #inserted
		where current of curRows1

		delete #deleted
		where current of curRows2

		declare curKeyColumns cursor
		for
			select tk.szColumnName, st.name
			from penpad_table_keys as tk
			join syscolumns as sc on
				sc.id = object_id(@szTableName) and
				sc.name = tk.szColumnName
			join systypes as st on
				sc.xtype = st.xtype and
				sc.xusertype = st.xusertype
			where
				tk.szTableName = @szTableName
			order by
				tk.iColumnSeq asc
		for read only

		open curKeyColumns
		fetch next from curKeyColumns into @szColumnName, @szColumnDataType

		/* Note - We assume that the prop ID column (if any) is part of the key */

		set @szKeys = ''
		set @szWhere = ''
		set @lIndex = 0
		/* For each column that is part of the key */
		while ( @@fetch_status = 0 )
		begin
			if ( @lIndex > 0 )
			begin
				set @szWhere = @szWhere + ' and '
			end
			set @szWhere = @szWhere + '[' + @szColumnName + '] = '

			if (
				@szColumnDataType = 'char' or
				@szColumnDataType = 'varchar' or
				@szColumnDataType = 'datetime' or
				@szColumnDataType = 'smalldatetime' or
				@szColumnDataType = 'sysname'
			)
			begin
				set @bQuote = 1
				set @szWhere = @szWhere + ''''
			end
			else
			begin
				set @bQuote = 0
			end

			set @szSQL = '
				delete #tmp_value

				insert #tmp_value (szValue)
				select convert(varchar(512), [' + @szColumnName + '])
				from #inserted_row
			'
			exec(@szSQL)
			
			select @szKey = szValue
			from #tmp_value

			set @szWhere = @szWhere + replace( @szKey, '''', '''''' )
			
			if ( @bQuote = 1 )
			begin
				set @szWhere = @szWhere + ''''
			end

			if ( @lIndex > 0 )
			begin
				set @szKeys = @szKeys + ' - '
			end
			set @szKeys = @szKeys + rtrim(@szKey)
			
			if ( @szColumnName = @szPIDColumnName )
			begin
				if ( isnumeric(@szKey) = 1 )
				begin
					set @lPropID = convert(int, @szKey)
				end
			end

			set @lIndex = @lIndex + 1
			fetch next from curKeyColumns into @szColumnName, @szColumnDataType
		end

		close curKeyColumns
		deallocate curKeyColumns

		select *
		into #trigger_table
		from #inserted_row
		
		exec PenpadGetSpecialCaseKeyValues @szTableName, @szKeys output
		/* If the table is a special case table, the above call will change the keys, else it will leave them alone */

		drop table #trigger_table

		if ( @lIndex > 0 )
		begin
			/* If the table was inserted initially, then updated later of the course of use from the
			 * penpad user, do not set the table row status to "3" = update because then this new
			 * table row will not be inserted into the PACS database when the user checks in changes.
			 */
			set @szSQL = 'update ' + @szTableName + ' set bPenpadRowStatusCode = 3 where bPenpadRowStatusCode = 0 and ' + @szWhere
			exec(@szSQL)

			declare curColumns cursor
			for
				select sc.name
				from syscolumns as sc
				where
					sc.id = object_id(@szTableName) and
					not sc.name in('bPenpadRowStatusCode','tsRowVersion')
				order by
					sc.colid asc
			for read only

			open curColumns
			fetch next from curColumns into @szColumnName

			while ( @@fetch_status = 0 )
			begin
				/* Get the old value */
				set @szSQL = '
					delete #tmp_value

					insert #tmp_value (szValue)
					select convert(varchar(512), [' + @szColumnName + '])
					from #deleted_row
				'
				exec(@szSQL)
				select @szOldValue = szValue
				from #tmp_value
				set @szOldValue = rtrim(@szOldValue)

				/* Get the new value */
				set @szSQL = '
					delete #tmp_value

					insert #tmp_value (szValue)
					select convert(varchar(512), [' + @szColumnName + '])
					from #inserted_row
				'
				exec(@szSQL)
				select @szNewValue = szValue
				from #tmp_value
				set @szNewValue = rtrim(@szNewValue)

				/* If the value has changed */
				if ( isnull(@szOldValue, '') <> isnull(@szNewValue, '') )
				begin
					insert penpad_change_log (
						run_id, change_dt, dml_operation, keys, prop_id, table_name, field_name, old_value, new_value
					) values (
						@lRunID, @dtChange, 2, @szKeys, @lPropID, @szTableName, @szColumnName, @szOldValue, @szNewValue
					)
				end

				fetch next from curColumns into @szColumnName
			end

			close curColumns
			deallocate curColumns
		end

		drop table #inserted_row
		drop table #deleted_row

		fetch next from curRows1 into @lDummy
		fetch next from curRows2 into @lDummy
	end

set nocount off

GO

