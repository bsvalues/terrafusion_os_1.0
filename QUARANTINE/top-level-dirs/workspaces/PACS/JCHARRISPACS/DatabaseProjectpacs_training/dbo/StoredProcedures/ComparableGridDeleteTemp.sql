
create procedure ComparableGridDeleteTemp
	@lTempPropGridID int
as

set nocount on

	delete comp_sales_temp_property_grids
	where lTempPropGridID = @lTempPropGridID

GO

