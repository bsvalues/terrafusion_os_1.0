
create procedure RecalcRowInsertStateCode
	@bPTDStateCode bit,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@szStateCode char(5),

	@imprv_hstd_val numeric(14,0),
	@imprv_non_hstd_val numeric(14,0),
	@land_hstd_val numeric(14,0),
	@land_non_hstd_val numeric(14,0),
	@ag_use_val numeric(14,0),
	@ag_market numeric(14,0),
	@timber_use numeric(14,0),
	@timber_market numeric(14,0),
	@mineral_val numeric(14,0),
	@personal_val numeric(14,0),
	@appraised_val numeric(14,0),
	@ten_percent_cap numeric(14,0),
	@assessed_val numeric(14,0),
	@market_val numeric(14,0),
	@imp_new_val numeric(14,0),
	@acres numeric(18,4),
	@pp_new_val numeric(14,0),
	@land_new_val numeric(14,0),
	@ag_acres numeric(18,4),
	@effective_front numeric(18,2)
as

set nocount on

	if ( @bPTDStateCode = 1 )
	begin
		insert property_val_state_cd with(rowlock) (
			prop_id, prop_val_yr, sup_num, state_cd,
			imprv_hstd_val, imprv_non_hstd_val, land_hstd_val, land_non_hstd_val,
			ag_use_val, ag_market, timber_use, timber_market,
			mineral_val, personal_val,
			appraised_val, ten_percent_cap, assessed_val, market_val,
			imp_new_val, acres,
			pp_new_val, land_new_val, ag_acres, effective_front

		) values (
			@lPropID, @lYear, @lSupNum, @szStateCode,
			@imprv_hstd_val, @imprv_non_hstd_val, @land_hstd_val, @land_non_hstd_val,
			@ag_use_val, @ag_market, @timber_use, @timber_market,
			@mineral_val, @personal_val,
			@appraised_val, @ten_percent_cap, @assessed_val, @market_val,
			@imp_new_val, @acres,
			@pp_new_val, @land_new_val, @ag_acres, @effective_front
		)
	end
	else
	begin
		insert property_val_cad_state_cd with(rowlock) (
			prop_id, prop_val_yr, sup_num, state_cd,
			imprv_hstd_val, imprv_non_hstd_val, land_hstd_val, land_non_hstd_val,
			ag_use_val, ag_market, timber_use, timber_market,
			mineral_val, personal_val,
			appraised_val, ten_percent_cap, assessed_val, market_val,
			imp_new_val, acres,
			pp_new_val, land_new_val, ag_acres, effective_front

		) values (
			@lPropID, @lYear, @lSupNum, @szStateCode,
			@imprv_hstd_val, @imprv_non_hstd_val, @land_hstd_val, @land_non_hstd_val,
			@ag_use_val, @ag_market, @timber_use, @timber_market,
			@mineral_val, @personal_val,
			@appraised_val, @ten_percent_cap, @assessed_val, @market_val,
			@imp_new_val, @acres,
			@pp_new_val, @land_new_val, @ag_acres, @effective_front
		)
	end

GO

