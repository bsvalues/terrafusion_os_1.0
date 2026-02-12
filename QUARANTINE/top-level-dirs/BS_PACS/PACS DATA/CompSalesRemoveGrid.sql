

create procedure CompSalesRemoveGrid
	@lGridID int
as

set nocount on

	begin transaction

	delete comp_sales_display_grid_layout with(rowlock)
	where
		lGridID = @lGridID

	delete comp_sales_display_grid with(rowlock)
	where
		lGridID = @lGridID

	commit transaction

set nocount off

GO

