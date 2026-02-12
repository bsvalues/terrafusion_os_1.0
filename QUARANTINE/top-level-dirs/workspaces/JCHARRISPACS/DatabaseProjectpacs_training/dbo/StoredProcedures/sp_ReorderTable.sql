
create procedure sp_ReorderTable
	@szTableName sysname,
	@szSQL_CreateTable varchar(4096),
	@bDropWorkTable bit = 0
as

set nocount on

	/*
		The suffix we will add to the table name & primary key name
		to create the name of the work table and primary key on the work table
	*/
	declare @szSuffix varchar(64)
	set @szSuffix = '_old_sp_ReorderTable'

	/* Build the work table name */
	declare @szWorkTableName sysname
	set @szWorkTableName = @szTableName + @szSuffix

	/* If the table has a primary key ... */
	declare @szPKName sysname
	declare @szWorkPKName sysname
	exec sp_GetPrimaryKeyName @szTableName, @szPKName output
	if (@szPKName is not null)
	begin
		/* Build the new primary key name */
		set @szWorkPKName = @szPKName + @szSuffix
	end

	/* Rename the existing table */
	exec sp_rename @szTableName, @szWorkTableName, 'OBJECT'

	/* Rename it's primary key, if necessary */
	if (@szWorkPKName is not null)
	begin
		exec sp_rename @szPKName, @szWorkPKName, 'OBJECT'
	end

	/* Create the new table */
	exec(@szSQL_CreateTable)

	/* Get the IDs of the work table and the new table */
	declare
		@lWorkTableID int,
		@lNewTableID int
	set @lWorkTableID = object_id(@szWorkTableName)
	set @lNewTableID = object_id(@szTableName)

	/* The create table SQL passed in *must* create a table named @szTableName, */
	/* and, @szTableName must have already existed */
	if (@lWorkTableID is null or @lNewTableID is null)
	begin
		return(1)
	end

	/* Get the list of columns that exist in both the work table and new table */
	/* These are the only columns from which we will restore data */
	select
		sc1.name
	into #tmp_columns
	from syscolumns as sc1 with(nolock)
	join syscolumns as sc2 with(nolock) on
		sc2.id = @lWorkTableID and
		sc1.name = sc2.name
	where
		sc1.id = @lNewTableID

	/* For each column */
	declare curColumns cursor
	for
		select name
		from #tmp_columns
	for read only

	declare @szColumnName sysname
	declare @szColumnList varchar(8000)
	declare @lIndex int

	open curColumns
	fetch next from curColumns into @szColumnName

	set @lIndex = 0
	set @szColumnList = ''
	while @@fetch_status = 0
	begin
		if (@lIndex > 0)
		begin
			set @szColumnList = @szColumnList + ', '
		end

		set @szColumnList = @szColumnList + @szColumnName

		set @lIndex = @lIndex + 1
		fetch next from curColumns into @szColumnName
	end

	close curColumns
	deallocate curColumns

	/* Now build the insert ... select ... SQL */
	declare @szSQL varchar(8000)

	set @szSQL = '
		insert ' + @szTableName + ' with(tablockx) (
			' + @szColumnList + '
		)
		select ' + @szColumnList + ' from ' + @szWorkTableName + ' with(tablockx)'

	exec(@szSQL)

	if (@bDropWorkTable = 1)
	begin
		set @szSQL = 'drop table ' + @szWorkTableName
		exec(@szSQL)
	end

set nocount off

GO

