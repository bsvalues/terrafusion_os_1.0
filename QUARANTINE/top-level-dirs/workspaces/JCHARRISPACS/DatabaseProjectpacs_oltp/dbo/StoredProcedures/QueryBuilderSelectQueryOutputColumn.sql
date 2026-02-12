
create procedure QueryBuilderSelectQueryOutputColumn
	@lQueryID int
as

	select q.lOrder, q.lUniqueColumnID, q.lAggregateFunction, q.lTable
	from query_builder_query_outputcolumn as q with(nolock)
	where
		q.lQueryID = @lQueryID
	order by q.lOrder asc

	return( @@rowcount )

GO

