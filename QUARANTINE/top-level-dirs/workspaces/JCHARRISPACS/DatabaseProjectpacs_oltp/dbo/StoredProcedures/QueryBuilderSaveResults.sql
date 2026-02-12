
create procedure QueryBuilderSaveResults
	@lQueryID int,
	@szTableSuffix varchar(6),
	@szSQL varchar(8000)
as

	declare @lResultsRowCount int

	exec(@szSQL)
	set @lResultsRowCount = @@rowcount

	update query_builder_query_results with(rowlock)
	set
		szTableSuffix = @szTableSuffix,
		lResultsRowCount = @lResultsRowCount,
		szSQL = @szSQL
	where lQueryID = @lQueryID
	
	if ( @@rowcount = 0 )
	begin
		insert query_builder_query_results with(rowlock) (
			lQueryID, szTableSuffix, lResultsRowCount, szSQL
		) values (
			@lQueryID, @szTableSuffix, @lResultsRowCount, @szSQL
		)
	end

	return( @@rowcount )

GO

