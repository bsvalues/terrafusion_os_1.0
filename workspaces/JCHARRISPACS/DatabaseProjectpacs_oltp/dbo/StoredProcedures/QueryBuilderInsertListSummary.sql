
create procedure QueryBuilderInsertListSummary
	@lElementType int,
	@lPacsUserID int,
	@dtExpire datetime,
	@lListID int = null output
as

set nocount on

	insert query_builder_list_summary with(rowlock) (
		lElementType, lPacsUserID, dtCreate, dtExpire
	) values (
		@lElementType, @lPacsUserID, getdate(), @dtExpire
	)
	set @lListID = scope_identity()

set nocount off

	select lListID = @lListID

GO

