
create procedure QueryBuilderInsertQueryOrderBy
	@lQueryID int,
	@lOrder int,
	@lUniqueColumnID int,
	@bAsc bit,
	@lOrderByPosition int,
	@lTable int
as

set nocount on

	insert query_builder_query_orderby with(rowlock) (
		lQueryID, lOrder, lUniqueColumnID, bAsc, lOrderByPosition, lTable
	) values (
		@lQueryID, @lOrder, @lUniqueColumnID, @bAsc, @lOrderByPosition, @lTable
	)

GO

