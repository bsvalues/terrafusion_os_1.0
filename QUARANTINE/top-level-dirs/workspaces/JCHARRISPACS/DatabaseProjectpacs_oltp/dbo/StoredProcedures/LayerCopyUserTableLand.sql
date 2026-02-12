create procedure LayerCopyUserTableLand
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int,
	@lLandSegID int = null,
	@lLandSegIDNew int = null
as

set nocount on

	insert dbo.user_land_detail with(rowlock) (
		prop_val_yr, sup_num, prop_id,
		land_seg_id,original_file,acres_in_application
	)
	select
		@lYear_To, @lSupNum_To, @lPropID_To,
		case
			when @lLandSegID is not null and @lLandSegIDNew is not null
			then @lLandSegIDNew
			else land_seg_id
		end,original_file,acres_in_application
	from dbo.user_land_detail with(nolock)
	where
		prop_val_yr = @lYear_From and
		sup_num = @lSupNum_From and
		prop_id = @lPropID_From and
		(@lLandSegID is null or land_seg_id = @lLandSegID)

GO

