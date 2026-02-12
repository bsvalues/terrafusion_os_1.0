
create procedure ComparableGridSetData
	@lPropGridID int,
	@bStatic bit,
	@szStaticDataFile varchar(255),
	@szAdjDataFile varchar(255)
as

set nocount on

	declare @szSQL varchar(512)

	if ( @bStatic = 1 )
	begin
		delete comparable_grid_static_data
		where lPropGridID = @lPropGridID

		set @szSQL = 'bulk insert comparable_grid_static_data from ''' + @szStaticDataFile + ''''
		exec(@szSQL)
	end
	else
	begin
		delete comparable_grid_live_data
		where lTempPropGridID = @lPropGridID

		set @szSQL = 'bulk insert comparable_grid_live_data from ''' + @szStaticDataFile + ''''
		exec(@szSQL)

		delete comp_sales_temp_property_adj
		where
			lTempPropGridID = @lPropGridID

		set @szSQL = 'bulk insert comp_sales_temp_property_adj from ''' + @szAdjDataFile + ''''
		exec(@szSQL)
	end

	return(0)

GO

