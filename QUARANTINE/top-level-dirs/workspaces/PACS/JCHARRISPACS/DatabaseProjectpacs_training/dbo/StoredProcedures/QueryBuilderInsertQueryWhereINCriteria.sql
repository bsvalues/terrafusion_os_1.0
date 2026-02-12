
create procedure QueryBuilderInsertQueryWhereINCriteria
	@lQueryID int,
	@lOrder int,
	@lINOrder int,
	@szINOperand varchar(255)
as

set nocount on

	insert query_builder_query_whereincriteria with(rowlock) (
		lQueryID, lOrder, lINOrder, szINOperand
	) values (
		@lQueryID, @lOrder, @lINOrder, @szINOperand
 	)

GO

