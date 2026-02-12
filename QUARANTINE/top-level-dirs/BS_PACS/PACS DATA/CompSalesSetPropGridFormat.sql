

create procedure CompSalesSetPropGridFormat
	@lPropGridID int,
	@lGridFormatID int
as

set nocount on

	update comp_sales_property_grids with(rowlock) set
		lGridID = @lGridFormatID
	where
		lPropGridID = @lPropGridID

set nocount off

GO

