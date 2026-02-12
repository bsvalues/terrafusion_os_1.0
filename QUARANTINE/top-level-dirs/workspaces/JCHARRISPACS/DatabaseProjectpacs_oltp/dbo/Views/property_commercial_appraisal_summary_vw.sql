


CREATE VIEW dbo.property_commercial_appraisal_summary_vw
AS

SELECT DISTINCT
	p.prop_id									AS prop_id,
	pv.prop_val_yr									AS year,
	RTRIM(pu.property_use_cd)	+ ' (' + RTRIM(property_use_desc)	+ ')'	AS property_use,
	RTRIM(sm.sub_market_cd)		+ ' (' + RTRIM(sm.sub_market_desc)	+ ')'	AS sub_market,
	RTRIM(rn.rgn_cd)		+ ' (' + RTRIM(rn.rgn_name)		+ ')'	AS region,
	RTRIM(p.dba_name)								AS dba_name,
	co.deed_dt									AS last_sale_date,
	ISNULL(sl.sl_price,0)								AS last_sale_price,
	par.total_rcn									AS total_rcn,
	pp.yr_blt									AS year_built,
	RTRIM(nh.hood_cd)		+ ' (' + RTRIM(nh.hood_name)		+ ')'	AS neighborhood,
	CASE ISNULL(pp.living_area,0)
		WHEN 0 THEN 0
		ELSE ( pp.land_total_sqft / pp.living_area )
	END										AS land_building_ratio,
	ISNULL(pp.living_area,0)							AS GBA,
	(ISNULL(i.NRA,0)		* ISNULL(ipv.income_pct,100)/100)		AS NRA,
	i.econ_area									AS income_econ_area,
	RTRIM(i.class)			+ ' (' + RTRIM(ic.class_desc)		+ ')'	AS income_class,
	RTRIM(i.prop_type_cd)		+ ' (' + RTRIM(ipt.prop_type_desc)	+ ')'	AS income_prop_type,
	RTRIM(i.level_cd)		+ ' (' + RTRIM(il.level_desc)		+ ')'	AS income_level,
	pp.land_total_sqft								AS total_sqft,
	pp.land_total_acres								AS total_acres,
	(ISNULL(ipv.income_pct,100)/100) * ISNULL(i.num_units,0)			AS total_units,
	pv.ag_use_val									AS value_ag_use,
 	pv.appr_method									AS appr_method,
	ld.land_seg_mkt_val								AS value_land_total,
	CASE ISNULL(pp.land_total_sqft,0)
		WHEN 0 THEN 0
		ELSE ( ld.land_seg_mkt_val ) / pp.land_total_sqft
	END										AS value_land_per_sqft,
	CASE ISNULL(pp.land_total_acres,0)
		WHEN 0 THEN 0
		ELSE ( ld.land_seg_mkt_val ) / pp.land_total_acres
	END										AS value_land_per_acre,
	pv.cost_imprv_hstd_val		+ pv.cost_imprv_non_hstd_val			AS value_imprv_cost,
	pv.income_imprv_hstd_val	+ pv.income_imprv_non_hstd_val			AS value_imprv_income,
	pv.shared_imprv_hstd_val	+ pv.shared_imprv_non_hstd_val			AS value_imprv_shared,
	pv.arb_imprv_hstd_val		+ pv.arb_imprv_non_hstd_val			AS value_imprv_arb,
	pv.dist_imprv_hstd_val		+ pv.dist_imprv_non_hstd_val			AS value_imprv_dist,
	pv.cost_land_hstd_val		+ pv.cost_land_non_hstd_val			AS value_land_cost,
	pv.income_land_hstd_val		+ pv.income_land_non_hstd_val			AS value_land_income,
	pv.shared_land_hstd_val		+ pv.shared_land_non_hstd_val			AS value_land_shared,
	pv.arb_land_hstd_val		+ pv.arb_land_non_hstd_val			AS value_land_arb,
	pv.dist_land_hstd_val		+ pv.dist_land_non_hstd_val			AS value_land_dist


FROM
	property						AS p
	inner join	property_val				AS pv	ON	p.prop_id		= pv.prop_id
	inner join 	prop_supp_assoc				AS psa  ON	psa.prop_id		= pv.prop_id 		and psa.owner_tax_yr = pv.prop_val_yr 		and psa.sup_num=pv.sup_num 
	left join	property_use				AS pu	ON	pu.property_use_cd	= pv.property_use_cd 
	left join	sub_market				AS sm	ON	pv.sub_market_cd	= sm.sub_market_cd
	left join	region					AS rn	ON	pv.rgn_cd		= rn.rgn_cd
	left join	chg_of_owner_prop_assoc			AS ca	ON	p.prop_id		= ca.prop_id 		and ca.seq_num = 0
				--and ca.sup_tax_yr = pv.prop_val_yr 		and ca.sup_num = pv.sup_num
	left join	chg_of_owner				AS co	ON	ca.chg_of_owner_id	= co.chg_of_owner_id
	left join	sale					AS sl	ON	co.chg_of_owner_id	= sl.chg_of_owner_id
--	left join 	imprv_detail				AS imd	ON	imd.prop_id		= p.prop_id		and imd.prop_val_yr	= pv.prop_val_yr
	left join	property_profile			AS pp	ON	p.prop_id		= pp.prop_id		and pp.prop_val_yr	= pv.prop_val_yr
	left join	neighborhood				AS nh	ON	pv.hood_cd		= nh.hood_cd		and nh.hood_yr		= pv.prop_val_yr
	left join	income_prop_assoc			AS ipa	ON	p.prop_id		= ipa.prop_id		and ipa.prop_val_yr	= pv.prop_val_yr	and ipa.sup_num = pv.sup_num 			and ipa.active_valuation	= 'T' 
	left join	income					AS i	ON	ipa.income_id		= i.income_id		and i.income_yr		= pv.prop_val_yr        and i.sup_num = pv.sup_num
	left join	income_class				AS ic	ON	i.class			= ic.class_cd
	left join	income_prop_type			AS ipt	ON	i.prop_type_cd		= ipt.prop_type_cd
	left join	income_level				AS il	ON	i.level_cd		= il.level_cd
	left join	income_prop_vw				AS ipv	ON	i.income_id		= ipv.income_id		and i.sup_num		= ipv.sup_num		and i.income_yr			= ipv.income_yr	and ipv.prop_id = p.prop_id
--	left join	land_detail				AS ld	ON	ld.prop_id		= p.prop_id		and ld.prop_val_yr	= pv.prop_val_yr
	left join 	land_detail_summary_vw			AS ld	ON 	ld.prop_id		= p.prop_id		and ld.prop_val_yr	= pv.prop_val_yr 	and ld.sup_num = pv.sup_num
	left join	property_commercial_appraisal_rcn_vw	AS par	ON	par.prop_id		= p.prop_id		and par.prop_val_yr	= pv.prop_val_yr 	and par.sup_num = pv.sup_num

GO

