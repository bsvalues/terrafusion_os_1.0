
create procedure WACalcTaxableUpdatePropertyValRow
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,

	@appraised_classified numeric(14,0),
	@appraised_non_classified numeric(14,0),
	@snr_imprv numeric(14,0),
	@snr_land numeric(14,0),
	@snr_new_val numeric(14,0),
	@snr_qualify_yr numeric(4,0),
	@snr_frz_imprv_hs numeric(14,0),
	@snr_frz_land_hs numeric(14,0),
	@snr_taxable_portion numeric(14,0),
	@snr_exempt_loss numeric(14,0),
	@snr_portion_applied numeric(14,0),
	@snr_imprv_lesser numeric(14,0),
	@snr_land_lesser numeric(14,0),
	@bSetRecalcError bit
as

set nocount on

	update wash_property_val with(rowlock)
	set
		appraised_classified = @appraised_classified,
		appraised_non_classified = @appraised_non_classified,
		snr_imprv = @snr_imprv,
		snr_land = @snr_land,
		snr_new_val = @snr_new_val,
		snr_qualify_yr = @snr_qualify_yr,
		snr_frz_imprv_hs = @snr_frz_imprv_hs,
		snr_frz_land_hs = @snr_frz_land_hs,
		snr_taxable_portion = @snr_taxable_portion,
		snr_exempt_loss = @snr_exempt_loss,
		snr_portion_applied = @snr_portion_applied,
		snr_imprv_lesser = @snr_imprv_lesser,
		snr_land_lesser = @snr_land_lesser
	where
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		prop_id = @lPropID

	if ( @bSetRecalcError = 1 )
	begin
		update property_val with(rowlock)
		set recalc_flag = 'E'
		where
			prop_val_yr = @lYear and
			sup_num = @lSupNum and
			prop_id = @lPropID
	end

GO

