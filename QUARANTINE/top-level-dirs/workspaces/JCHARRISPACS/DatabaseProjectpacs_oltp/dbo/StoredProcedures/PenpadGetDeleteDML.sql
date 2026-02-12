

create procedure PenpadGetDeleteDML
	/* DML is an acronym for Data Manipulation Language */
as

set nocount on

	create table #tmp_dml
	(
		lID int identity(100000,1) not null,
		szSQL varchar(8000) not null
		,
		constraint PK_tmp_dml primary key clustered (lID)
		with fillfactor = 100
	)

	/* Build all of the delete SQL statements */
	declare
		@lDeleteID int,
		@szTableName sysname,
		@szColumnName sysname,
		@szColumnDataType sysname,
		@szColumnValue varchar(512),
		@szSQL varchar(8000),
		@lIndex int,
		@bQuote bit

	declare curDeletes cursor
	for
		select lDeleteID, szTableName
		from penpad_delete_log
		order by lDeleteID asc
	for read only

	open curDeletes
	fetch next from curDeletes into @lDeleteID, @szTableName

	/* For each row deleted on the penpad */
	while ( @@fetch_status = 0 )
	begin
		set @szSQL = 'delete ' + @szTableName + ' where'

		declare curDeleteKeys cursor
		for
			select dk.szColumnName, dk.szColumnValue, st.name
			from penpad_delete_log_keys as dk
			join syscolumns as sc on
				sc.id = object_id(@szTableName) and
				sc.name = dk.szColumnName
			join systypes as st on
				sc.xtype = st.xtype
			where
				dk.lDeleteID = @lDeleteID
			order by
				dk.lDeleteID asc
		for read only

		open curDeleteKeys
		fetch next from curDeleteKeys into @szColumnName, @szColumnValue, @szColumnDataType

		set @lIndex = 0
		/* For each key within the row deleted */
		while ( @@fetch_status = 0 )
		begin
			if ( @lIndex > 0 )
			begin
				set @szSQL = @szSQL + ' and'
			end

			set @szSQL = @szSQL + ' [' + @szColumnName + '] = '

			if (
				@szColumnDataType = 'char' or
				@szColumnDataType = 'varchar' or
				@szColumnDataType = 'datetime' or
				@szColumnDataType = 'smalldatetime' or
				@szColumnDataType = 'sysname'
			)
			begin
				set @bQuote = 1

				set @szSQL = @szSQL + ''''
			end
			else
			begin
				set @bQuote = 0
			end

			set @szSQL = @szSQL + replace(@szColumnValue, '''', '''''')

			if ( @bQuote = 1 )
			begin
				set @szSQL = @szSQL + ''''
			end

			set @lIndex = @lIndex + 1
			fetch next from curDeleteKeys into @szColumnName, @szColumnValue, @szColumnDataType
		end

		close curDeleteKeys
		deallocate curDeleteKeys

		insert #tmp_dml ( szSQL ) values ( @szSQL )

		fetch next from curDeletes into @lDeleteID, @szTableName
	end

	close curDeletes
	deallocate curDeletes

set nocount off

	select szSQL
	from #tmp_dml
	order by lID asc

GO

