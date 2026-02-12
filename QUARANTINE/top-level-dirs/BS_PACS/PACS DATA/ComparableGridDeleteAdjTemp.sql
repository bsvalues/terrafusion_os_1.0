
create procedure ComparableGridDeleteAdjTemp
	@lTempPropGridID int,
	@bSystemAdj bit
as

set nocount on

	delete comp_sales_temp_property_adj
	where
		lTempPropGridID = @lTempPropGridID and
		bSystemAdj = @bSystemAdj

GO

