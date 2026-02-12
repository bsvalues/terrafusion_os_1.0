
create procedure WALayerCopyTablePV
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int,

	@szMethod varchar(23)
as

set nocount on

	insert dbo.wash_property_val (
		prop_val_yr,
		sup_num,
		prop_id,
		appraised_classified,
		appraised_non_classified,
		snr_imprv,
		snr_land,
		snr_new_val,
		snr_qualify_yr,
		snr_qualify_yr_override,
		snr_frz_imprv_hs,
		snr_frz_land_hs,
		snr_frz_imprv_hs_override,
		snr_frz_land_hs_override,
		snr_taxable_portion,
		snr_exempt_loss,
		snr_portion_applied,
		snr_new_val_override,
		comment_update_date,
		comment_update_user,
		snr_comment,
		snr_imprv_lesser,
		snr_land_lesser,
		dist_val_reason_cd,
		snr_imprv_hs,
		snr_imprv_hs_override,
		snr_land_hs,
		snr_land_hs_override,
		snr_ag_hs,
		snr_ag_hs_override,
		snr_timber_hs,
		snr_timber_hs_override
	)
	select
		@lYear_To,
		@lSupNum_To,
		@lPropID_To,
		appraised_classified,
		appraised_non_classified,
		snr_imprv,
		snr_land,
		snr_new_val,
		snr_qualify_yr,
		snr_qualify_yr_override,
		snr_frz_imprv_hs,
		snr_frz_land_hs,
		snr_frz_imprv_hs_override,
		snr_frz_land_hs_override,
		snr_taxable_portion,
		snr_exempt_loss,
		snr_portion_applied,
		snr_new_val_override,
		comment_update_date,
		comment_update_user,
		snr_comment,
		snr_imprv_lesser,
		snr_land_lesser,
		dist_val_reason_cd,
		snr_imprv_hs,
		snr_imprv_hs_override,
		snr_land_hs,
		snr_land_hs_override,
		snr_ag_hs,
		snr_ag_hs_override,
		snr_timber_hs,
		snr_timber_hs_override
	from dbo.wash_property_val with(nolock)
	where
		prop_val_yr = @lYear_From and
		sup_num = @lSupNum_From and
		prop_id = @lPropID_From

GO

