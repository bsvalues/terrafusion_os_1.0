

create procedure CompSalesAddCompAdj
	@lPropGridID int,
	@lCompPropID int,
	@lAdjFieldID int,
	@fAdjAmount numeric(18,6),
	@szAdjReason varchar(255),
	@lImprovDetID int,
	@lImprovAttributeID int,
	@lSaleID int
as

set nocount on

	insert comp_sales_property_adj with(rowlock) (
		lPropGridID, lCompPropID, lAdjFieldID, fAdjAmount, szAdjReason, lImprovDetID, lImprovAttributeID, lSaleID
	) values (
		@lPropGridID, @lCompPropID, @lAdjFieldID, @fAdjAmount, @szAdjReason, @lImprovDetID, @lImprovAttributeID, @lSaleID
	)

GO

