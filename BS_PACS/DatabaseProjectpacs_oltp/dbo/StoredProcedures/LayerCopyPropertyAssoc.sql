
create procedure LayerCopyPropertyAssoc
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int
as

set nocount on

	-- only copy links if property id's the same.  Copying linked properties
	-- is optional when doing MassCreateNewProperties

	if (@lPropID_From <> @lPropID_To)
	begin
		return (0)
	end

	insert dbo.property_assoc with(rowlock)
	(
		parent_prop_id,
		child_prop_id,
		prop_val_yr,
		sup_num,
		lOrder,
		link_type_cd,
		link_sub_type_cd
	)
	select parent_prop_id,
			child_prop_id,
			@lYear_To,
			@lSupNum_To,
			lOrder,
			link_type_cd,
			link_sub_type_cd
	from dbo.property_assoc as pa with (nolock)
	where pa.parent_prop_id = @lPropID_From
	and pa.prop_val_yr = @lYear_From
	and pa.sup_num = @lSupNum_From

	-- NOTE: Do not copy the child_prop_id because only the parent is being
	--		 supplemented or whatever.

GO

