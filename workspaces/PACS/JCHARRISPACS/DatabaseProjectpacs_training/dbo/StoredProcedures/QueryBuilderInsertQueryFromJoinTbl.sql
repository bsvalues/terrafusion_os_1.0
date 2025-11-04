
create procedure QueryBuilderInsertQueryFromJoinTbl
	@lQueryID int,
	@lOrder int,
	@szTable varchar(127),
	@bLeftOuterJoin bit
as

set nocount on

	insert query_builder_query_fromjointbl with(rowlock) (
		lQueryID, lOrder, szTable, bLeftOuterJoin
	) values (
		@lQueryID, @lOrder, @szTable, @bLeftOuterJoin
	)

GO

