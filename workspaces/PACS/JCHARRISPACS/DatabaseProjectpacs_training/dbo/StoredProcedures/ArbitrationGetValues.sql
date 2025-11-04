
CREATE procedure ArbitrationGetValues

	@input_arbitration_id int,
	@input_prop_val_yr numeric(4,0),
	@input_prop_id int

as

	select convert(varchar(10), begin_recalc_dt, 101) as begin_recalc_dt,
			convert(varchar(10), pv.recalc_dt, 101) as curr_recalc_dt,
			convert(varchar(10), final_recalc_dt, 101) as final_recalc_dt, 
			begin_land_hstd_val, 
			pv.land_hstd_val as curr_land_hstd_val, 
			final_land_hstd_val, 
			begin_land_non_hstd_val, 
			pv.land_non_hstd_val as curr_land_non_hstd_val, 
			final_land_non_hstd_val, 
			begin_imprv_hstd_val, 
			pv.imprv_hstd_val as curr_imprv_hstd_val,
			final_imprv_hstd_val, 
			begin_imprv_non_hstd_val, 
			pv.imprv_non_hstd_val as curr_imprv_non_hstd_val,
			final_imprv_non_hstd_val, 
			isnull(begin_ag_market,0) + isnull(begin_timber_market,0) as begin_ag_tim_market, 
			isnull(pv.ag_market, 0) + isnull(pv.timber_market, 0) as curr_ag_tim_market,
			isnull(final_ag_market,0) + isnull(final_timber_market,0) as final_ag_tim_market, 
			isnull(begin_ag_use_val,0) + isnull(begin_timber_use,0) as begin_ag_tim_use,
			isnull(pv.ag_use_val, 0) + isnull(pv.timber_use, 0) as curr_ag_tim_use, 
			isnull(final_ag_use_val,0) + isnull(final_timber_use,0) as final_ag_tim_use, 
			begin_market, 
			pv.market as curr_market,
			final_market, 
			begin_ten_percent_cap, 
			pv.ten_percent_cap as curr_ten_percent_cap,
			final_ten_percent_cap, 
			begin_assessed_val, 
			pv.assessed_val as curr_assessed_val,
			final_assessed_val, 
			begin_exemptions, 
			dbo.fn_getExemptions(pv.prop_id, pv.prop_val_yr, pv.sup_num) as curr_exemptions,
			final_exemptions, 
			begin_entities, 
			dbo.fn_getEntities(pv.prop_id, pv.prop_val_yr, pv.sup_num) as curr_entities,
			final_entities, 
			begin_rendered_val, 
			pv.rendered_val as curr_rendered_val,
			final_rendered_val 
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
			and aca.prop_id = @input_prop_id

GO

