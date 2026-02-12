
CREATE procedure ArbitrationUpdateCaseValues

	@input_arbitration_id int,
	@input_prop_val_yr numeric(4,0),
	@input_value_type bit,
	@input_update_type bit

as

	if @input_value_type = 0
	begin
		update arbitration_case_assoc
		set begin_land_hstd_val = pv.land_hstd_val,
			begin_land_non_hstd_val = pv.land_non_hstd_val,
			begin_imprv_hstd_val = pv.imprv_hstd_val,
			begin_imprv_non_hstd_val = pv.imprv_non_hstd_val,
			begin_ag_use_val = pv.ag_use_val,
			begin_ag_market = pv.ag_market,
			begin_timber_use = pv.timber_use,
			begin_timber_market = pv.timber_market,
			begin_market = pv.market,
			begin_appraised_val = pv.appraised_val,
			begin_assessed_val = pv.assessed_val,
			begin_ten_percent_cap = pv.ten_percent_cap,
			begin_rendered_val = pv.rendered_val,
			begin_exemptions = dbo.fn_getExemptions(aca.prop_id, aca.prop_val_yr, psa.sup_num),
			begin_entities = dbo.fn_getEntities(aca.prop_id, aca.prop_val_yr, psa.sup_num),
			begin_recalc_dt = pv.recalc_dt
		from arbitration_case_assoc as aca
		with (nolock)
		join property_val as pv
		with (nolock)
		on aca.prop_id = pv.prop_id
		and aca.prop_val_yr = pv.prop_val_yr
		join prop_supp_assoc as psa
		with (nolock)
		on pv.prop_val_yr = psa.owner_tax_yr
		and pv.prop_id = psa.prop_id
		and pv.sup_num = psa.sup_num
		where aca.begin_recalc_dt is null
		and aca.arbitration_id = @input_arbitration_id
		and aca.prop_val_yr = @input_prop_val_yr
	end
	else
	begin
		if @input_update_type = 0
		begin
			update arbitration_case_assoc
			set final_land_hstd_val = pv.land_hstd_val,
				final_land_non_hstd_val = pv.land_non_hstd_val,
				final_imprv_hstd_val = pv.imprv_hstd_val,
				final_imprv_non_hstd_val = pv.imprv_non_hstd_val,
				final_ag_use_val = pv.ag_use_val,
				final_ag_market = pv.ag_market,
				final_timber_use = pv.timber_use,
				final_timber_market = pv.timber_market,
				final_market = pv.market,
				final_appraised_val = pv.appraised_val,
				final_assessed_val = pv.assessed_val,
				final_ten_percent_cap = pv.ten_percent_cap,
				final_rendered_val = pv.rendered_val,
				final_exemptions = dbo.fn_getExemptions(aca.prop_id, aca.prop_val_yr, psa.sup_num),
				final_entities = dbo.fn_getEntities(aca.prop_id, aca.prop_val_yr, psa.sup_num),
				final_recalc_dt = pv.recalc_dt
			from arbitration_case_assoc as aca
			with (nolock)
			join property_val as pv
			with (nolock)
			on aca.prop_id = pv.prop_id
			and aca.prop_val_yr = pv.prop_val_yr
			join prop_supp_assoc as psa
			with (nolock)
			on pv.prop_val_yr = psa.owner_tax_yr
			and pv.prop_id = psa.prop_id
			and pv.sup_num = psa.sup_num
			where aca.arbitration_id = @input_arbitration_id
			and aca.prop_val_yr = @input_prop_val_yr
		end
		else
		begin
			update arbitration_case_assoc
			set final_land_hstd_val = 0,
				final_land_non_hstd_val = 0,
				final_imprv_hstd_val = 0,
				final_imprv_non_hstd_val = 0,
				final_ag_use_val = 0,
				final_ag_market = 0,
				final_timber_use = 0,
				final_timber_market = 0,
				final_market = 0,
				final_appraised_val = 0,
				final_assessed_val = 0,
				final_ten_percent_cap = 0,
				final_rendered_val = 0,
				final_exemptions = '',
				final_entities = '',
				final_recalc_dt = null
			from arbitration_case_assoc as aca
			with (nolock)
			where aca.arbitration_id = @input_arbitration_id
			and aca.prop_val_yr = @input_prop_val_yr
		end
	end

GO

