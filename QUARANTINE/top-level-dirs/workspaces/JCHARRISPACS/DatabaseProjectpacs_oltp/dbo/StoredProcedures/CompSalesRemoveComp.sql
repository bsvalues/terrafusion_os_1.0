

create procedure CompSalesRemoveComp
	@lPropGridID int
as

set nocount on

	begin transaction

	/* Remove the adjustments on the grid */
	delete comp_sales_property_adj with(rowlock)
	where
		lPropGridID = @lPropGridID

	/* Remove the comparables on the grid */
	delete comp_sales_property with(rowlock)
	where
		lPropGridID = @lPropGridID

	commit transaction

GO

