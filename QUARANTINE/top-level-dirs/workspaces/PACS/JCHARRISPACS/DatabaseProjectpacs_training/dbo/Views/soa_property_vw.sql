
create view soa_property_vw
as

	select
		
		run.dataset_id,

		-- Callout D
		p.prop_id,
		p.geo_id,
		pv.legal_acreage,
		ta.tax_area_number,
		pv.legal_desc,
		s.situs_display,
		p.dba_name,
		wpoe.exmpt_type_cd,

		-- Callout E
		o.owner_id,
		o.pct_ownership,
		acct.file_as_name,
		addr.addr_line1,
		addr.addr_line2,
		addr.addr_line3,
		addr.addr_city,
		addr.addr_state,
		addr.addr_zip,
		addr.is_international,
		c.country_name,
		
		-- Callout F
		imprv_value = isnull(wpov.imprv_hstd_val + wpov.imprv_non_hstd_val, 0),
		land_value = isnull(wpov.land_hstd_val + wpov.land_non_hstd_val, 0),
		productivity_value = isnull(wpov.ag_hs_use_val + wpov.ag_use_val, 0),
		value = isnull(wpov.appraised_classified + wpov.appraised_non_classified, 0),
		taxable_value = isnull(wpov.taxable_classified + wpov.taxable_non_classified, 0)
		
	from soa_run as run with(nolock)
	join property as p with(nolock) on
		p.prop_id = run.prop_id
	join property_val as pv with(nolock) on
		pv.prop_val_yr = run.year and
		pv.sup_num = run.sup_num and
		pv.prop_id = run.prop_id
	join property_tax_area as pta with(nolock) on
		pta.year = run.year and
		pta.sup_num = run.sup_num and
		pta.prop_id = run.prop_id
	join tax_area as ta with(nolock) on
		ta.tax_area_id = pta.tax_area_id
	join owner as o with(nolock) on
		o.owner_tax_yr = run.year and
		o.sup_num = run.sup_num and
		o.prop_id = run.prop_id
	join account as acct with(nolock) on
		acct.acct_id = o.owner_id

	left join prop_supp_assoc wpov_assoc with(nolock) on
		wpov_assoc.prop_id = run.prop_id and
		wpov_assoc.owner_tax_yr = (select top 1 tax_yr from pacs_system)
	left join wash_prop_owner_val wpov with(nolock) on
		wpov.prop_id = wpov_assoc.prop_id and
		wpov.year =  wpov_assoc.owner_tax_yr and
		wpov.sup_num = wpov_assoc.sup_num

	left outer join address as addr with(nolock) on
		addr.acct_id = acct.acct_id and
		addr.primary_addr = 'Y'
	left outer join country as c with(nolock) on
		c.country_cd = addr.country_cd
	left outer join situs as s with(nolock) on
		s.prop_id = pv.prop_id and
		s.primary_situs = 'Y'
	left outer join wash_prop_owner_exemption as wpoe with(nolock) on
		wpoe.year = pv.prop_val_yr and
		wpoe.sup_num = pv.sup_num and
		wpoe.prop_id = pv.prop_id

GO

