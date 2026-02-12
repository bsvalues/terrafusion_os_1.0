
create procedure sp_GarbageCollector
	@szQueryBuildResultsSavedDBName sysname = null,
	@szQueryBuildResultsSavedTablePrefix sysname = null
as

set nocount on

	declare @dtNow datetime
	set @dtNow = getdate()

	if ( @szQueryBuildResultsSavedDBName is null )
	begin
		if exists (
			select dbid
			from master.dbo.sysdatabases
			where name = 'pacs_lists'
		)
		begin
			set @szQueryBuildResultsSavedDBName = 'pacs_lists'
		end
	end
	if ( @szQueryBuildResultsSavedTablePrefix is null )
	begin
		set @szQueryBuildResultsSavedTablePrefix = 'tb_qbresults'
	end

	-- Comp sales temp data
	delete comp_sales_temp_property_grids with(tablockx)
	truncate table sales_comp_print

	-- Value calc temp data
	truncate table recalc_prop_list
	truncate table recalc_prop_list_current_division

	-- Clean up expired query builder lists (normalized lists)
	delete query_builder_list_summary with(tablockx)
	where dtExpire < @dtNow

	-- Clean up expired query builder application queries and results

	-- But first check for valid DB name
	if not exists (
		select dbid
		from master.dbo.sysdatabases
		where name = @szQueryBuildResultsSavedDBName
	)
	begin
		return
	end

	declare
		@lQueryID int,
		@szTableSuffix varchar(6),
		@szTable sysname,
		@szSQL varchar(8000)
	declare curExpired insensitive cursor
	for
		select q.lQueryID, qr.szTableSuffix
		from query_builder_query as q with(nolock)
		left outer join query_builder_query_results as qr with(nolock) on
			qr.lQueryID = q.lQueryID
		where
			q.dtExpire < @dtNow
		order by 1 asc
	for read only

	open curExpired
	fetch next from curExpired into @lQueryID, @szTableSuffix

	while ( @@fetch_status = 0 )
	begin
		if ( @szTableSuffix is not null )
		begin
			set @szTable = @szQueryBuildResultsSavedDBName + '.dbo.' + @szQueryBuildResultsSavedTablePrefix + @szTableSuffix

			set @szSQL = 'if object_id(''' + @szTable + ''') is not null begin drop table ' + @szTable + ' end'
			exec(@szSQL)
		end

		delete query_builder_query where lQueryID = @lQueryID

		fetch next from curExpired into @lQueryID, @szTableSuffix
	end

	close curExpired
	deallocate curExpired

GO

