
create procedure CompSalesRemovePropGrid
	@lPropGridID int
as

set nocount on

	begin transaction

	/* In case it is a commercial grid */
	delete comp_sales_corp_grid_options with(rowlock)
	where
		lPropGridID = @lPropGridID

	/* Remove the adjustments for the grid */
	delete comp_sales_property_adj with(rowlock)
	where
		lPropGridID = @lPropGridID

	/* Remove the comparable properties for the grid */
	delete comp_sales_property with(rowlock)
	where
		lPropGridID = @lPropGridID

	/* Remove any grid associations */
	update comparable_grid_prop_year_comptype
	set lPropGridID = null
	where lPropGridID = @lPropGridID
	update comparable_grid_prop_year_comptype
	set lMarketValPropGridID = null
	where lMarketValPropGridID = @lPropGridID

	/* Remove the grid itself */
	delete comp_sales_property_grids with(rowlock)
	where
		lPropGridID = @lPropGridID

	commit transaction

GO

