
create procedure WACalcTaxableInsertPropOwnerVal
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@lOwnerID int,
	
	@land_hstd_val numeric(14,0),
	@land_non_hstd_val numeric(14,0),
	@imprv_hstd_val numeric(14,0),
	@imprv_non_hstd_val numeric(14,0),
	@ag_use_val numeric(14,0),
	@ag_market numeric(14,0),
	@ag_loss numeric(14,0),
	@ag_hs_use_val numeric(14,0),
	@ag_hs_market numeric(14,0),
	@ag_hs_loss numeric(14,0),
	@timber_use_val numeric(14,0),
	@timber_market numeric(14,0),
	@timber_loss numeric(14,0),
	@timber_hs_use_val numeric(14,0),
	@timber_hs_market numeric(14,0),
	@timber_hs_loss numeric(14,0),
	@new_val_hs numeric(14,0),
	@new_val_nhs numeric(14,0),
	@new_val_p numeric(14,0),
	@appraised numeric(14,0),
	@market numeric(14,0),
	@snr_frz_imprv_hs numeric(14,0),
	@snr_frz_land_hs numeric(14,0),
	@appraised_classified numeric(14,0),
	@appraised_non_classified numeric(14,0),
	@taxable_classified numeric(14,0),
	@taxable_non_classified numeric(14,0),
	@state_assessed numeric(14,0),
	@destroyed_prop bit,
	@destroyed_jan1_value numeric(14,0),
	@destroyed_prorate_pct decimal(20,19),
	@prorate_type varchar(5),
	@prorate_begin datetime,
	@prorate_end datetime,
	@boe_status bit,
	@destroyed_jan1_classified_value numeric(14,0) = 0,
	@destroyed_jan1_non_classified_value numeric(14,0) = 0,
	@non_taxed_mkt_val numeric(14,0)

as

set nocount on

	insert wash_prop_owner_val with(rowlock) (
		year, sup_num, prop_id, owner_id,
		land_hstd_val, land_non_hstd_val, imprv_hstd_val, imprv_non_hstd_val,
		ag_use_val, ag_market, ag_loss, ag_hs_use_val, ag_hs_market, ag_hs_loss,
		timber_use_val, timber_market, timber_loss, timber_hs_use_val, timber_hs_market, timber_hs_loss,
		new_val_hs, new_val_nhs, new_val_p,
		appraised, market, snr_frz_imprv_hs, snr_frz_land_hs,
		appraised_classified, appraised_non_classified,
		taxable_classified, taxable_non_classified, state_assessed,
		destroyed_prop, destroyed_jan1_value, destroyed_prorate_pct,
		prorate_type, prorate_begin, prorate_end, boe_status,
		destroyed_jan1_classified_value, destroyed_jan1_non_classified_value,
		non_taxed_mkt_val
	) values (
		@lYear, @lSupNum, @lPropID, @lOwnerID,
		@land_hstd_val, @land_non_hstd_val, @imprv_hstd_val, @imprv_non_hstd_val,
		@ag_use_val, @ag_market, @ag_loss, @ag_hs_use_val, @ag_hs_market, @ag_hs_loss,
		@timber_use_val, @timber_market, @timber_loss, @timber_hs_use_val, @timber_hs_market, @timber_hs_loss,
		@new_val_hs, @new_val_nhs, @new_val_p,
		@appraised, @market, @snr_frz_imprv_hs, @snr_frz_land_hs,
		@appraised_classified, @appraised_non_classified,
		@taxable_classified, @taxable_non_classified, @state_assessed,
		@destroyed_prop, @destroyed_jan1_value, @destroyed_prorate_pct,
		@prorate_type, @prorate_begin, @prorate_end, @boe_status,
		@destroyed_jan1_classified_value, @destroyed_jan1_non_classified_value,
		@non_taxed_mkt_val
	)

GO

