
create view wash_prop_levy_rate_vw
as

select distinct
	psa.owner_tax_yr year,
	psa.prop_id,
	psa.sup_num,
	l.tax_district_id,
	l.levy_cd,

	levy_rate_classified = convert(numeric(13,10), case
		when p.prop_type_cd in ('R','MH') and lexreal.exmpt_type_cd is not null then 0
		when p.prop_type_cd in ('P','A') and lexpers.exmpt_type_cd is not null then 0
		when (pe_snr.exmpt_type_cd is not null) and (isnull(l.senior_levy_rate, 0) > 0) then isnull(l.senior_levy_rate, 0)
		else isnull(l.levy_rate, 0)
	end),

	levy_rate_non_classified = convert(numeric(13,10), case
		when (pe_snr.exmpt_type_cd is not null) and (isnull(l.senior_levy_rate, 0) > 0) then isnull(l.senior_levy_rate, 0)
		else isnull(l.levy_rate, 0)
	end),

	levy_exemption = case
		when p.prop_type_cd in ('R','MH') and lexreal.exmpt_type_cd is not null then 'SNR/DSBL'
		when p.prop_type_cd in ('P','A') and lexpers.exmpt_type_cd is not null then 'FARM'
		else ''
	end,
	
	l.levy_description

	from prop_supp_assoc psa with(nolock)

	join owner o with(nolock)
		on o.owner_tax_yr = psa.owner_tax_yr
		and o.sup_num = psa.sup_num
		and o.prop_id = psa.prop_id

	join property p with(nolock)
		on p.prop_id = psa.prop_id

	join property_val pv with(nolock)
		on pv.prop_val_yr = psa.owner_tax_yr
		and pv.sup_num = psa.sup_num
		and pv.prop_id = psa.prop_id

	join property_tax_area pta with(nolock)
		on pta.[year] = psa.owner_tax_yr
		and pta.sup_num = psa.sup_num
		and pta.prop_id = psa.prop_id
		
	join tax_area_fund_assoc tafa with(nolock)
		on tafa.[year] = pta.[year]
		and tafa.tax_area_id = pta.tax_area_id

	join levy l with(nolock)
		on l.[year] = tafa.[year]
		and l.tax_district_id = tafa.tax_district_id
		and l.levy_cd = tafa.levy_cd

	left join property_exemption pe_snr with(nolock)
		on pe_snr.exmpt_tax_yr		= psa.owner_tax_yr
		and pe_snr.owner_tax_yr		= psa.owner_tax_yr
		and pe_snr.prop_id			= psa.prop_id
		and pe_snr.owner_id			= o.owner_id
		and pe_snr.exmpt_type_cd	= 'SNR/DSBL'

	left join levy_exemption lexreal with(nolock)
		on lexreal.year = l.year
		and lexreal.tax_district_id = l.tax_district_id
		and lexreal.levy_cd = l.levy_cd
		and lexreal.exmpt_type_cd = 'SNR/DSBL'

	left join levy_exemption lexpers with(nolock)
		on lexpers.year = l.year
		and lexpers.tax_district_id = l.tax_district_id
		and lexpers.levy_cd = l.levy_cd
		and lexpers.exmpt_type_cd = 'FARM'

GO

