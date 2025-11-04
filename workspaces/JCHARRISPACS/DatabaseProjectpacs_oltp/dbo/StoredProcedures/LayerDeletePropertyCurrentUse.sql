
CREATE procedure LayerDeletePropertyCurrentUse
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int
as

set nocount on
	
	delete from dbo.property_current_use_review
	with (rowlock)
	where prop_id = @lPropID_From and
	year = @lYear_From and
	sup_num = @lSupNum_From

	

	delete from dbo.property_current_use_removal
	with (rowlock)
	where prop_id = @lPropID_From and
	year = @lYear_From and
	sup_num = @lSupNum_From

GO

