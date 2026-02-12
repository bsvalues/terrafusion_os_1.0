
create procedure WACalcTaxableSelectProperty
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@lPacsUserID int
as

	if ( @lPacsUserID <> 0 )
	begin
		select
			convert(smallint, pv.prop_val_yr),
			convert(smallint, pv.sup_num),
			pv.prop_id,
			o.owner_id,
			upper(rtrim(p.prop_type_cd)),
			isDeleted = convert(bit, case when pv.prop_inactive_dt is null or pv.udi_parent = 'T' then 0 else 1 end),
			pv.market,
			pv.imprv_hstd_val,
			pv.imprv_non_hstd_val,
			pv.land_hstd_val,
			pv.land_non_hstd_val,
			pv.ag_hs_use_val,
			pv.ag_use_val,
			pv.timber_hs_use_val,
			pv.timber_use,
			pv.ag_hs_mkt_val,
			pv.ag_market,
			pv.timber_hs_mkt_val,
			pv.timber_market,
			pv.appraised_val,
			pv.pp_farm,
			pv.pp_non_farm,
			pv.new_val_hs,
			pv.new_val_nhs,
			pv.new_val_p,
			pv.new_val_imprv_hs,
			convert(smallint, wpv.snr_qualify_yr),
			wpv.snr_qualify_yr_override,
			wpv.snr_frz_imprv_hs,
			wpv.snr_frz_imprv_hs_override,
			wpv.snr_frz_land_hs,
			wpv.snr_frz_land_hs_override,
			wpv.snr_new_val,
			isnull(wpv.snr_new_val_override, 0),
			convert(numeric(14,0), pv.dor_value),
			isnull(pv.non_taxed_mkt_val, 0),
			isnull(wpv.snr_imprv_hs, 0),
			wpv.snr_imprv_hs_override,
			isnull(wpv.snr_land_hs, 0),
			wpv.snr_land_hs_override,
			isnull(wpv.snr_ag_hs, 0),
			wpv.snr_ag_hs_override,
			isnull(wpv.snr_timber_hs, 0),
			wpv.snr_timber_hs_override
		from #taxable_property_list as tpl with(nolock)
		join property_val as pv with(nolock) on
			tpl.year = pv.prop_val_yr and
			tpl.sup_num = pv.sup_num and
			tpl.prop_id = pv.prop_id
		join wash_property_val as wpv with(nolock) on
			tpl.year = wpv.prop_val_yr and
			tpl.sup_num = wpv.sup_num and
			tpl.prop_id = wpv.prop_id
		join owner as o with(nolock) on
			tpl.year = o.owner_tax_yr and
			tpl.sup_num = o.sup_num and
			tpl.prop_id = o.prop_id
		join property as p with(nolock) on
			tpl.prop_id = p.prop_id
		order by 1, 2, 3, 4
	end
	else if ( @lPropID <> 0 )
	begin
		select
			convert(smallint, pv.prop_val_yr),
			convert(smallint, pv.sup_num),
			pv.prop_id,
			o.owner_id,
			upper(rtrim(p.prop_type_cd)),
			isDeleted = convert(bit, case when pv.prop_inactive_dt is null or pv.udi_parent = 'T' then 0 else 1 end),
			pv.market,
			pv.imprv_hstd_val,
			pv.imprv_non_hstd_val,
			pv.land_hstd_val,
			pv.land_non_hstd_val,
			pv.ag_hs_use_val,
			pv.ag_use_val,
			pv.timber_hs_use_val,
			pv.timber_use,
			pv.ag_hs_mkt_val,
			pv.ag_market,
			pv.timber_hs_mkt_val,
			pv.timber_market,
			pv.appraised_val,
			pv.pp_farm,
			pv.pp_non_farm,
			pv.new_val_hs,
			pv.new_val_nhs,
			pv.new_val_p,
			pv.new_val_imprv_hs,
			convert(smallint, wpv.snr_qualify_yr),
			wpv.snr_qualify_yr_override,
			wpv.snr_frz_imprv_hs,
			wpv.snr_frz_imprv_hs_override,
			wpv.snr_frz_land_hs,
			wpv.snr_frz_land_hs_override,
			wpv.snr_new_val,
			isnull(wpv.snr_new_val_override, 0),
			convert(numeric(14,0), pv.dor_value),
			isnull(pv.non_taxed_mkt_val, 0),
			isnull(wpv.snr_imprv_hs, 0),
			wpv.snr_imprv_hs_override,
			isnull(wpv.snr_land_hs, 0),
			wpv.snr_land_hs_override,
			isnull(wpv.snr_ag_hs, 0),
			wpv.snr_ag_hs_override,
			isnull(wpv.snr_timber_hs, 0),
			wpv.snr_timber_hs_override
		from property_val as pv with(nolock)
		join wash_property_val as wpv with(nolock) on
			pv.prop_val_yr = wpv.prop_val_yr and
			pv.sup_num = wpv.sup_num and
			pv.prop_id = wpv.prop_id
		join owner as o with(nolock) on
			pv.prop_val_yr = o.owner_tax_yr and
			pv.sup_num = o.sup_num and
			pv.prop_id = o.prop_id
		join property as p with(nolock) on
			pv.prop_id = p.prop_id
		where
			pv.prop_val_yr = @lYear and
			pv.sup_num = @lSupNum and
			pv.prop_id = @lPropID
		order by 1, 2, 3, 4
	end
	else -- Select all
	begin
		select
			convert(smallint, pv.prop_val_yr),
			convert(smallint, pv.sup_num),
			pv.prop_id,
			o.owner_id,
			upper(rtrim(p.prop_type_cd)),
			isDeleted = convert(bit, case when pv.prop_inactive_dt is null or pv.udi_parent = 'T' then 0 else 1 end),
			pv.market,
			pv.imprv_hstd_val,
			pv.imprv_non_hstd_val,
			pv.land_hstd_val,
			pv.land_non_hstd_val,
			pv.ag_hs_use_val,
			pv.ag_use_val,
			pv.timber_hs_use_val,
			pv.timber_use,
			pv.ag_hs_mkt_val,
			pv.ag_market,
			pv.timber_hs_mkt_val,
			pv.timber_market,
			pv.appraised_val,
			pv.pp_farm,
			pv.pp_non_farm,
			pv.new_val_hs,
			pv.new_val_nhs,
			pv.new_val_p,
			pv.new_val_imprv_hs,
			convert(smallint, wpv.snr_qualify_yr),
			wpv.snr_qualify_yr_override,
			wpv.snr_frz_imprv_hs,
			wpv.snr_frz_imprv_hs_override,
			wpv.snr_frz_land_hs,
			wpv.snr_frz_land_hs_override,
			wpv.snr_new_val,
			isnull(wpv.snr_new_val_override, 0),
			convert(numeric(14,0), pv.dor_value),
			isnull(pv.non_taxed_mkt_val, 0),
			isnull(wpv.snr_imprv_hs, 0),
			wpv.snr_imprv_hs_override,
			isnull(wpv.snr_land_hs, 0),
			wpv.snr_land_hs_override,
			isnull(wpv.snr_ag_hs, 0),
			wpv.snr_ag_hs_override,
			isnull(wpv.snr_timber_hs, 0),
			wpv.snr_timber_hs_override
		from property_val as pv with(nolock)
		join wash_property_val as wpv with(nolock) on
			pv.prop_val_yr = wpv.prop_val_yr and
			pv.sup_num = wpv.sup_num and
			pv.prop_id = wpv.prop_id
		join owner as o with(nolock) on
			pv.prop_val_yr = o.owner_tax_yr and
			pv.sup_num = o.sup_num and
			pv.prop_id = o.prop_id
		join property as p with(nolock) on
			pv.prop_id = p.prop_id
		where
			pv.prop_val_yr = @lYear and
			pv.sup_num = @lSupNum
		order by 1, 2, 3, 4
	end

GO

