
create procedure QueryBuilderSelectQueryResults
	@lQueryID int
as

	select szTableSuffix, lResultsRowCount, szSQL
	from query_builder_query_results with(nolock)
	where lQueryID = @lQueryID

	return( @@rowcount )

GO

