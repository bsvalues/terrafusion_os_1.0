
create procedure CalculateTaxableSelectProperty
	@lYear numeric(4,0),
	@lSupNum int,
	@bUseList bit
as

	if ( @bUseList = 1 )
	begin
		select
			pv.prop_id,
			upper(rtrim(p.prop_type_cd)),
			isnull(pv.market, 0),
			isnull(pv.assessed_val, 0),
			isnull(pv.appraised_val, 0),
			isnull(pv.imprv_hstd_val, 0),
			isnull(pv.imprv_non_hstd_val, 0),
			isnull(pv.land_hstd_val, 0),
			isnull(pv.land_non_hstd_val, 0),
			isnull(pv.ten_percent_cap, 0),
			upper(rtrim(pv.sup_action)),
			isnull(pv.ag_use_val, 0),
			isnull(pv.timber_use, 0),
			isnull(pv.ag_market, 0),
			isnull(pv.timber_market, 0),
			isnull(pv.tif_imprv_val, 0),
			isnull(pv.tif_land_val, 0),
			upper(rtrim(pv.tif_flag)),
			convert(bit, case when pv.prop_inactive_dt is not null then 1 else 0 end),
			isnull(pv.ag_late_loss, 0),
			o.owner_id,
			isnull(pv.new_val_hs, 0),
			isnull(pv.new_val_nhs, 0),
			isnull(pv.new_val_p, 0),
			convert(bit, case when o.apply_pct_exemptions = 'T' then 1 else 0 end),
			isnull(o.pct_ownership, 100.0),
			sum(isnull(pvsc.acres, 0.0)) as size_acres,
			isnull(pv.timber_78, 0)
		from property_val as pv with(nolock)
		join property as p with(nolock) on
			pv.prop_id = p.prop_id
		join owner as o with(nolock) on
			pv.prop_id = o.prop_id and
			pv.prop_val_yr = o.owner_tax_yr and
			pv.sup_num = o.sup_num
		left outer join property_val_state_cd as pvsc with(nolock) on
			pvsc.prop_id = pv.prop_id and
			pvsc.prop_val_yr = pv.prop_val_yr and
			pvsc.sup_num = pv.sup_num
		where
			pv.prop_id in (
				select prop_id from #totals_prop_list
			) and
			pv.prop_val_yr = @lYear and
			pv.sup_num = @lSupNum and
			pv.accept_create_id is null
		group by
			pv.prop_id,
			upper(rtrim(p.prop_type_cd)),
			isnull(pv.market, 0),
			isnull(pv.assessed_val, 0),
			isnull(pv.appraised_val, 0),
			isnull(pv.imprv_hstd_val, 0),
			isnull(pv.imprv_non_hstd_val, 0),
			isnull(pv.land_hstd_val, 0),
			isnull(pv.land_non_hstd_val, 0),
			isnull(pv.ten_percent_cap, 0),
			upper(rtrim(pv.sup_action)),
			isnull(pv.ag_use_val, 0),
			isnull(pv.timber_use, 0),
			isnull(pv.ag_market, 0),
			isnull(pv.timber_market, 0),
			isnull(pv.tif_imprv_val, 0),
			isnull(pv.tif_land_val, 0),
			upper(rtrim(pv.tif_flag)),
			convert(bit, case when pv.prop_inactive_dt is not null then 1 else 0 end),
			isnull(pv.ag_late_loss, 0),
			o.owner_id,
			isnull(pv.new_val_hs, 0),
			isnull(pv.new_val_nhs, 0),
			isnull(pv.new_val_p, 0),
			convert(bit, case when o.apply_pct_exemptions = 'T' then 1 else 0 end),
			isnull(o.pct_ownership, 100.0),
			isnull(pv.timber_78, 0)
		order by pv.prop_id asc, o.owner_id asc

	end
	else
	begin
		select
			pv.prop_id,
			upper(rtrim(p.prop_type_cd)),
			isnull(pv.market, 0),
			isnull(pv.assessed_val, 0),
			isnull(pv.appraised_val, 0),
			isnull(pv.imprv_hstd_val, 0),
			isnull(pv.imprv_non_hstd_val, 0),
			isnull(pv.land_hstd_val, 0),
			isnull(pv.land_non_hstd_val, 0),
			isnull(pv.ten_percent_cap, 0),
			upper(rtrim(pv.sup_action)),
			isnull(pv.ag_use_val, 0),
			isnull(pv.timber_use, 0),
			isnull(pv.ag_market, 0),
			isnull(pv.timber_market, 0),
			isnull(pv.tif_imprv_val, 0),
			isnull(pv.tif_land_val, 0),
			upper(rtrim(pv.tif_flag)),
			convert(bit, case when pv.prop_inactive_dt is not null then 1 else 0 end),
			isnull(pv.ag_late_loss, 0),
			o.owner_id,
			isnull(pv.new_val_hs, 0),
			isnull(pv.new_val_nhs, 0),
			isnull(pv.new_val_p, 0),
			convert(bit, case when o.apply_pct_exemptions = 'T' then 1 else 0 end),
			isnull(o.pct_ownership, 100.0),
			sum(isnull(pvsc.acres, 0.0)) as size_acres,
			isnull(pv.timber_78, 0)
		from property_val as pv with(nolock)
		join property as p with(nolock) on
			pv.prop_id = p.prop_id
		join owner as o with(nolock) on
			pv.prop_id = o.prop_id and
			pv.prop_val_yr = o.owner_tax_yr and
			pv.sup_num = o.sup_num
		left outer join property_val_state_cd as pvsc with(nolock) on
			pvsc.prop_id = pv.prop_id and
			pvsc.prop_val_yr = pv.prop_val_yr and
			pvsc.sup_num = pv.sup_num
		where
			pv.prop_val_yr = @lYear and
			pv.sup_num = @lSupNum and
			pv.accept_create_id is null
		group by
			pv.prop_id,
			upper(rtrim(p.prop_type_cd)),
			isnull(pv.market, 0),
			isnull(pv.assessed_val, 0),
			isnull(pv.appraised_val, 0),
			isnull(pv.imprv_hstd_val, 0),
			isnull(pv.imprv_non_hstd_val, 0),
			isnull(pv.land_hstd_val, 0),
			isnull(pv.land_non_hstd_val, 0),
			isnull(pv.ten_percent_cap, 0),
			upper(rtrim(pv.sup_action)),
			isnull(pv.ag_use_val, 0),
			isnull(pv.timber_use, 0),
			isnull(pv.ag_market, 0),
			isnull(pv.timber_market, 0),
			isnull(pv.tif_imprv_val, 0),
			isnull(pv.tif_land_val, 0),
			upper(rtrim(pv.tif_flag)),
			convert(bit, case when pv.prop_inactive_dt is not null then 1 else 0 end),
			isnull(pv.ag_late_loss, 0),
			o.owner_id,
			isnull(pv.new_val_hs, 0),
			isnull(pv.new_val_nhs, 0),
			isnull(pv.new_val_p, 0),
			convert(bit, case when o.apply_pct_exemptions = 'T' then 1 else 0 end),
			isnull(o.pct_ownership, 100.0),
			isnull(pv.timber_78, 0)
		order by pv.prop_id asc, o.owner_id asc
	end

	return(@@rowcount)

GO

