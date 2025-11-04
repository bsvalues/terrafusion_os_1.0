

create procedure CompSalesSetPropGridColWidths
	@lPropGridID int,
	@lColWidthFields int,
	@lColWidthSubject int
as

set nocount on

	update comp_sales_property_grids with(rowlock) set
		lColWidthFields = @lColWidthFields,
		lColWidthSubject = @lColWidthSubject
	where
		lPropGridID = @lPropGridID

set nocount off

GO

