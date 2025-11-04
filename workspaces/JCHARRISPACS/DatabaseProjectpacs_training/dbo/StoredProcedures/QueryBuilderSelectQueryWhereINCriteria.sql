
create procedure QueryBuilderSelectQueryWhereINCriteria
	@lQueryID int
as

	select q.lOrder, q.lINOrder, q.szINOperand
	from query_builder_query_whereincriteria as q with(nolock)
	where
		q.lQueryID = @lQueryID
	order by q.lOrder asc, q.lINOrder

	return( @@rowcount )

GO

