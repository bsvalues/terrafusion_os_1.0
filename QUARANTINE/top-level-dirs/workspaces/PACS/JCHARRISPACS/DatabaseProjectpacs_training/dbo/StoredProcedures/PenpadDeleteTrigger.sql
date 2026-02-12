

create procedure PenpadDeleteTrigger
	@szTableName sysname
as

	/*
		Even though a table must have a primary key defined in order for
		this trigger to track it, we do not check for said primary key
		since triggers are only created for tables with primary keys.
		This is handled in the penpad database creation in the PACS app.
	*/

set nocount on

	if ( (select count(*) from #deleted) = 0 )
	begin
		/* It does happen */
		return(0)
	end

	declare
		@szColumnName sysname,
		@szSQL varchar(2048),
		@szKeys varchar(512),
		@szKey varchar(512),
		@lIndex int,
		@szPIDColumnName varchar(255),
		@lPropID int,
		@lRunID int

	declare @lDummy int
	declare @lDeleteID int

	select @lRunID = run_id
	from penpad_run with(nolock)

	declare curRows cursor
	for
		select convert(int, 0)
		from #deleted
	for update

	open curRows
	fetch next from curRows into @lDummy

	while ( @@fetch_status = 0 )
	begin
		/* Add a row indicating the delete */
		insert penpad_delete_log (szTableName) values (@szTableName)
		set @lDeleteID = @@identity

		select
			@szPIDColumnName = szPIDColumnName
		from penpad_db_objects
		where
			szObjectName = @szTableName and
			szObjectType = 'U'

		declare curKeyColumns cursor
		for
			select szColumnName
			from penpad_table_keys
			where
				szTableName = @szTableName
			order by
				iColumnSeq asc
		for read only

		open curKeyColumns
		fetch next from curKeyColumns into @szColumnName

		select top 1 *
		into #deleted_row
		from #deleted

		delete #deleted
		where current of curRows

		/* Note - We assume that the prop ID column (if any) is part of the key */

		set @szKeys = ''
		set @lIndex = 0
		/* For each column that is part of the key */
		while ( @@fetch_status = 0 )
		begin
			set @szSQL = '
				insert penpad_delete_log_keys (
					lDeleteID, szColumnName, szColumnValue
				)
				select
					' + convert(varchar(16), @lDeleteID) + ', ''' + @szColumnName + ''', convert(varchar(512), ' + @szColumnName + ')
				from #deleted_row
			'

			/* Add a row to penpad_delete_log_keys */
			exec(@szSQL)

			select @szKey = szColumnValue
			from penpad_delete_log_keys
			where
				lDeleteID = @lDeleteID and
				szColumnName = @szColumnName

			if ( @lIndex > 0 )
			begin
				set @szKeys = @szKeys + ' - '
			end
			set @szKeys = @szKeys + rtrim(@szKey)

			set @lIndex = @lIndex + 1

			if ( @szColumnName = @szPIDColumnName )
			begin
				if ( isnumeric(@szKey) = 1 )
				begin
					set @lPropID = convert(int, @szKey)
				end
			end

			fetch next from curKeyColumns into @szColumnName
		end

		close curKeyColumns
		deallocate curKeyColumns

		select *
		into #trigger_table
		from #deleted_row
		
		exec PenpadGetSpecialCaseKeyValues @szTableName, @szKeys output
		/* If the table is a special case table, the above call will change the keys, else it will leave them alone */

		insert penpad_change_log (
			run_id, change_dt, dml_operation, keys, prop_id, table_name, field_name, old_value, new_value
		) values (
			@lRunID, getdate(), 0, @szKeys, @lPropID, @szTableName, null, null, null
		)

		drop table #deleted_row
		drop table #trigger_table

		fetch next from curRows into @lDummy
	end

	close curRows
	deallocate curRows

set nocount off

GO

