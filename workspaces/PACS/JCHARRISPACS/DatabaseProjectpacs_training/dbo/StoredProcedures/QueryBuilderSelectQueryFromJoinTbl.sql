
create procedure QueryBuilderSelectQueryFromJoinTbl
	@lQueryID int
as

	select q.lOrder, q.szTable, q.bLeftOuterJoin
	from query_builder_query_fromjointbl as q with(nolock)
	where
		q.lQueryID = @lQueryID
	order by q.lOrder asc

	return( @@rowcount )

GO

