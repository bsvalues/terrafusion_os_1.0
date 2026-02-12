
create procedure LayerCopyTablePropertyDestroyed
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int
as

set nocount on

	insert dbo.destroyed_property with(rowlock) (
		prop_val_yr,
		sup_num,
		prop_id,
		date_destroyed,
		january_one_value,
		january_one_land_value,
		january_one_imprv_value,
		jan1_taxable_classified,
		jan1_taxable_non_classified,
		after_destruction_value,
		after_destruction_land_value,
		after_destruction_imprv_value,
		reduction_value,
		reduction_land_value,
		reduction_imprv_value,
		percent_destroyed,
		days_prior,
		days_after,
		cause,
		date_approved,
		appraiser
	)
	select
		@lYear_To,
		@lSupNum_To,
		@lPropID_To,
		date_destroyed,
		january_one_value,
		january_one_land_value,
		january_one_imprv_value,
		jan1_taxable_classified,
		jan1_taxable_non_classified,
		after_destruction_value,
		after_destruction_land_value,
		after_destruction_imprv_value,
		reduction_value,
		reduction_land_value,
		reduction_imprv_value,
		percent_destroyed,
		days_prior,
		days_after,
		cause,
		date_approved,
		appraiser
	from dbo.destroyed_property with(nolock)
	where
		prop_val_yr = @lYear_From and
		sup_num = @lSupNum_From and
		prop_id = @lPropID_From

	return(0)

GO

