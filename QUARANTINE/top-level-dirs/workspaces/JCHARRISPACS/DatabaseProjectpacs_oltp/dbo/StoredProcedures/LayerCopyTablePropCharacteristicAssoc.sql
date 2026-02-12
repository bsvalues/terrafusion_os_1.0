
create procedure LayerCopyTablePropCharacteristicAssoc
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int
as

set nocount on

	insert dbo.prop_characteristic_assoc with(rowlock) (
		prop_id,
		prop_val_yr,
		sup_num,
		sale_id,
		characteristic_cd,
		attribute_cd
	)
	select
		@lPropID_To,
		@lYear_To,
		@lSupNum_To,
		sale_id,
		characteristic_cd,
		attribute_cd
	from dbo.prop_characteristic_assoc with(nolock)
	where
		prop_val_yr = @lYear_From and
		sup_num = @lSupNum_From and
		prop_id = @lPropID_From and
		((@lYear_From = @lYear_To and @lPropID_From = @lPropID_To) or sale_id = 0)

	return(0)

GO

