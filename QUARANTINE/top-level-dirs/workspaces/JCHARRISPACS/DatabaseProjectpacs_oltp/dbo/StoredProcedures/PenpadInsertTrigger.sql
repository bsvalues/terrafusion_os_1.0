


create procedure PenpadInsertTrigger
	@szTableName sysname
as

	/*
		Even though a table must have a primary key defined in order for
		this trigger to track it, we do not check for said primary key
		since triggers are only created for tables with primary keys.
		This is handled in the penpad database creation in the PACS app.
	*/

set nocount on

	if ( (select count(*) from #inserted) = 0 )
	begin
		/* It does happen */
		return(0)
	end

	create table #tmp_value
	(
		szValue varchar(512) null
	)

	declare
		@szColumnName sysname,
		@szSQL varchar(2048),
		@lIndex int,
		@szKeys varchar(512),
		@szKey varchar(512),
		@lPropID int,
		@szPIDColumnName varchar(255)

	declare @lRunID int
	declare @dtChange datetime
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

	declare curRows cursor
	for
		select convert(int, 0)
		from #inserted
	for update

	open curRows
	fetch next from curRows into @lDummy

	while ( @@fetch_status = 0 )
	begin
		declare curKeyColumns cursor
		for
			select tk.szColumnName
			from penpad_table_keys as tk
			where
				tk.szTableName = @szTableName
			order by
				tk.iColumnSeq asc
		for read only

		open curKeyColumns
		fetch next from curKeyColumns into @szColumnName

		select top 1 *
		into #inserted_row
		from #inserted

		delete #inserted
		where current of curRows

		/* Note - We assume that the prop ID column (if any) is part of the key */

		set @szKeys = ''
		set @lIndex = 0
		/* For each column that is part of the key */
		while ( @@fetch_status = 0 )
		begin
			set @szSQL = '
				delete #tmp_value

				insert #tmp_value (szValue)
				select convert(varchar(512), [' + @szColumnName + '])
				from #inserted_row
			'
			exec(@szSQL)
			
			select @szKey = szValue
			from #tmp_value

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
			fetch next from curKeyColumns into @szColumnName
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

				insert penpad_change_log (
					run_id, change_dt, dml_operation, keys, prop_id, table_name, field_name, old_value, new_value
				) values (
					@lRunID, @dtChange, 1, @szKeys, @lPropID, @szTableName, @szColumnName, null, @szNewValue
				)

				fetch next from curColumns into @szColumnName
			end

			close curColumns
			deallocate curColumns
		end

		drop table #inserted_row

		fetch next from curRows into @lDummy
	end

	close curRows
	deallocate curRows

set nocount off

GO

