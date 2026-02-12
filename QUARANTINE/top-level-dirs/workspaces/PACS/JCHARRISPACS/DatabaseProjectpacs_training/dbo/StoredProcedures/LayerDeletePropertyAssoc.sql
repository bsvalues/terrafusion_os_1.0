
create procedure LayerDeletePropertyAssoc
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int
as

set nocount on

	delete from dbo.property_assoc
	with (rowlock)
	where parent_prop_id = @lPropID_From
	and prop_val_yr = @lYear_From
	and sup_num = @lSupNum_From

GO

