
create procedure QueryBuilderInsertQueryOutputColumn
	@lQueryID int,
	@lOrder int,
	@lUniqueColumnID int,
	@lAggregateFunction int,
	@lTable int
as

set nocount on

	insert query_builder_query_outputcolumn with(rowlock) (
		lQueryID, lOrder, lUniqueColumnID, lAggregateFunction, lTable
	) values (
		@lQueryID, @lOrder, @lUniqueColumnID, @lAggregateFunction, @lTable
	)

GO

