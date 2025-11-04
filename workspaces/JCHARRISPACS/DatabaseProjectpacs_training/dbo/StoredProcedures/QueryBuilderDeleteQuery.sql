
create procedure QueryBuilderDeleteQuery
	@lQueryID int
as

set nocount on

	delete query_builder_query
	where lQueryID = @lQueryID

GO

