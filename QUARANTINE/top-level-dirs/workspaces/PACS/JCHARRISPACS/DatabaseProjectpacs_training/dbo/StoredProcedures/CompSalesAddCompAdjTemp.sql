
create procedure CompSalesAddCompAdjTemp
	@lTempPropGridID int,
	@lCompPropID int,
	@lAdjFieldID int,
	@fAdjAmount numeric(18,6),
	@szAdjReason varchar(255),
	@lImprovDetID int,
	@lImprovAttributeID int,
	@fUserAdjAmount numeric(18,6),
	@lSaleID int
as

set nocount on

	insert comp_sales_temp_property_adj with(rowlock) (
		lTempPropGridID, lCompPropID, lAdjFieldID, fAdjAmount, szAdjReason, lImprovDetID, lImprovAttributeID, fUserAdjAmount, lSaleID
	) values (
		@lTempPropGridID, @lCompPropID, @lAdjFieldID, @fAdjAmount, @szAdjReason, @lImprovDetID, @lImprovAttributeID, @fUserAdjAmount, @lSaleID
	)

GO

