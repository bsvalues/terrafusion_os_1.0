
create procedure ComparableGridAddTempProperty
	@lTempPropGridID int,
	@lCompPropID int,
	@lSaleID int
as

set nocount on

	insert comp_sales_temp_property with(rowlock) (
		lTempPropGridID, lCompPropID, lSaleID, lColWidthGrid
	) values (
		@lTempPropGridID, @lCompPropID, @lSaleID, 2160
	)

GO

