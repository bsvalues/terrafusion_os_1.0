

create procedure CompSalesAddGridField
	@lGridID int,
	@szFieldName varchar(64)
as

set nocount on

	declare @lFieldID int

	select
		@lFieldID = lFieldID
	from comp_sales_display_grid_fields with(nolock)
	where
		szFieldName = @szFieldName

	insert comp_sales_display_grid_layout with(rowlock) (
		lGridID, lFieldID
	) values (
		@lGridID, @lFieldID
	)

set nocount off

GO

