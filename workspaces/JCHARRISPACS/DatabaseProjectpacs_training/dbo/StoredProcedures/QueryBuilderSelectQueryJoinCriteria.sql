
create procedure QueryBuilderSelectQueryJoinCriteria
	@lQueryID int
as

	select q.lOrder, q.lJoinCriteriaOrder, q.bCriteriaPresent, q.lUniqueColumnID_JoinedTable, q.lBaseTable, q.lUniqueColumnID_BaseTable, q.szConstant
	from query_builder_query_joincriteria as q with(nolock)
	where
		q.lQueryID = @lQueryID
	order by q.lOrder asc, q.lJoinCriteriaOrder asc

	return( @@rowcount )

GO

