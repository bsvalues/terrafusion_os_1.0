

create procedure CompSalesRemoveCompAdj
	@lPropGridID int,
	@lCompPropID int
as

set nocount on

	delete comp_sales_property_adj with(rowlock)
	where
		lPropGridID = @lPropGridID and
		lCompPropID = @lCompPropID

set nocount off

GO

