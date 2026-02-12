
create procedure ComparableGridInsertAdjTemp
	@lTempPropGridID int,
	@lCompPropID int,
	@lAdjFieldID int,
	@fAdjAmount numeric(18,6),
	@szAdjReason varchar(255),
	@lImprovDetID int,
	@lImprovAttributeID int
as

set nocount on

	insert comp_sales_temp_property_adj with(rowlock) (
		lTempPropGridID, lCompPropID, lAdjFieldID, fAdjAmount, szAdjReason, lImprovDetID, lImprovAttributeID
	) values (
		@lTempPropGridID, @lCompPropID, @lAdjFieldID, @fAdjAmount, @szAdjReason, @lImprovDetID, @lImprovAttributeID
	)

GO

