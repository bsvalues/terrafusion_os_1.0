

create procedure CompSalesSetPropGridName
	@lPropGridID int,
	@szGridName varchar(64)
as

set nocount on

	update comp_sales_property_grids with(rowlock) set
		szGridName = @szGridName
	where
		lPropGridID = @lPropGridID

set nocount off

GO

