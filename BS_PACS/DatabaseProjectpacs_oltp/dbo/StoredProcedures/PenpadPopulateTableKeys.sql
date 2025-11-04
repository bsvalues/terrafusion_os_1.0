
create procedure PenpadPopulateTableKeys

as

set nocount on

	/* Start over */
	delete penpad_table_keys

	/* Used in our calls to PenpadGetPrimaryKey */
	create table #tmp_pk_columns
	(
		szColumnName sysname not null,
		szColumnDataType sysname not null,
		iColumnSeq smallint not null
	)

	declare @szTableName sysname
	declare curTables cursor
	for
		select name
		from sysobjects
		where
			xtype = 'U'
		order by name asc
	for read only

	open curTables
	fetch next from curTables into @szTableName

	/* For each table */
	while ( @@fetch_status = 0 )
	begin
		/* Get it's primary key, if any */
		exec PenpadGetPrimaryKey @szTableName

		/* Save the columns of the primary key */
		insert penpad_table_keys (
			szTableName, szColumnName, iColumnSeq
		)
		select
			@szTableName, szColumnName, iColumnSeq
		from #tmp_pk_columns
		where not exists
		(
			select *
			from penpad_table_keys ptk
				with (nolock)
			where ptk.szTableName = @szTableName
				and ptk.szColumnName = szColumnName
		)
		order by
			szColumnName asc

		fetch next from curTables into @szTableName
	end

	close curTables
	deallocate curTables

set nocount off

GO

