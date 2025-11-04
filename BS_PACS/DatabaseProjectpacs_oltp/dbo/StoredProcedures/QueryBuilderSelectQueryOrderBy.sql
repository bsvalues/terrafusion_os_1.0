
create procedure QueryBuilderSelectQueryOrderBy
	@lQueryID int
as

	select q.lOrder, q.lUniqueColumnID, q.bAsc, q.lOrderByPosition, q.lTable
	from query_builder_query_orderby as q with(nolock)
	where
		q.lQueryID = @lQueryID
	order by q.lOrder asc

	return( @@rowcount )

GO

