
create procedure LayerDeleteUserTableLand
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@lLandSegID int = null
as

set nocount on

	delete dbo.user_land_detail with(rowlock)
	where
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		prop_id = @lPropID and
		(@lLandSegID is null or land_seg_id = @lLandSegID)

GO

