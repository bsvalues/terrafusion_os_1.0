
create procedure QueryBuilderInsertQueryJoinCriteria
	@lQueryID int,
	@lOrder int,
	@lJoinCriteriaOrder int,
	@bCriteriaPresent bit,
	@lUniqueColumnID_JoinedTable int,
	@lBaseTable int,
	@lUniqueColumnID_BaseTable int,
	@szConstant varchar(255)
as

set nocount on

	insert query_builder_query_joincriteria with(rowlock) (
		lQueryID, lOrder, lJoinCriteriaOrder, bCriteriaPresent, lUniqueColumnID_JoinedTable, lBaseTable, lUniqueColumnID_BaseTable, szConstant
	) values (
		@lQueryID, @lOrder, @lJoinCriteriaOrder, @bCriteriaPresent, @lUniqueColumnID_JoinedTable, @lBaseTable, @lUniqueColumnID_BaseTable, @szConstant
	)

GO

