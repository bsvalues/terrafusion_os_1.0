
create procedure ComparableGridConvertStatic
	@lPropGridID int,
	@bStatic bit
as

set nocount on

	update comp_sales_property_grids with(rowlock)
	set bStatic = @bStatic
	where lPropGridID = @lPropGridID

	return(0)

GO

