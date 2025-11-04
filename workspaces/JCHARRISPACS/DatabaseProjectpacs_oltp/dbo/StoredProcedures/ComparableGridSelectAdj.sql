
create procedure ComparableGridSelectAdj
	@lTempPropGridID int,
	@bSystemAdj bit
as

	select
		c.lCompPropID, c.lAdjFieldID, isnull(c.fUserAdjAmount, 0), c.szAdjReason,
		c.lImprovDetID, c.lImprovAttributeID, c.lSaleID
	from comp_sales_temp_property_adj as c with(nolock)
	where
		c.lTempPropGridID = @lTempPropGridID and
		c.bSystemAdj = @bSystemAdj
	order by c.lCompPropID asc, c.lKey asc

	return( @@rowcount )

GO

