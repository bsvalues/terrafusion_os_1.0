


CREATE PROCEDURE SupplementalRollReportPropertyInfo
	@input_prop_id int,
	@input_yr int,
	@input_sup_num int
AS


SELECT 1 as DumbID,

-- Current values first
	pv.sup_num as curr_sup_num,
	pv.prop_val_yr as curr_yr, 
	s.sup_group_id, 
	pv.prop_id, 
	pv.sup_cd,
	pv.sup_action,
	p.prop_type_cd,
	p.geo_id,
	pv.legal_desc as curr_legal_desc,
	ISNULL(curr_a.appraiser_nm,'') as curr_appraiser_nm,
	ISNULL(curr_u.pacs_user_name,'') as curr_operator,
	pv.eff_size_acres as curr_acres,
	mineral_acct.type_of_int as curr_type_of_int,
	pv.imprv_hstd_val as curr_imp_hs,
	pv.imprv_non_hstd_val as curr_imp_nhs,
	pv.land_hstd_val as curr_land_hs,
	pv.legal_acreage as curr_legal_acres,
	pv.mineral_int_pct as curr_mineral_int_pct,
	pv.land_non_hstd_val as curr_land_nhs,
	pv.map_id as curr_map_id,
	pv.ag_use_val + pv.timber_use as curr_prod_use,
	pv.ag_market + pv.timber_market as curr_prod_market,
	mortgage_assoc.mortgage_co_id as curr_mortgage_cd,
	pv.market as curr_market,
	pv.ag_use_val + pv.timber_use - pv.ag_market - pv.timber_market as curr_prod_loss,
	pv.appraised_val as curr_appraised_val,
	pv.ten_percent_cap as curr_hs_cap,
	pv.assessed_val as curr_assessed_val,
	situs.situs_display,
	pv.sup_desc as curr_sup_desc,
	pv.prop_inactive_dt as curr_inactive_dt,
--HS 17685 
	p.ref_id1 as ref_id1,
	p.ref_id2 as ref_id2,


-- Previous values

	ppv.sup_num as prev_sup_num,
	ppv.prop_val_yr as prev_yr, 
	ppv.legal_desc as prev_legal_desc,
	ISNULL(prev_a.appraiser_nm,'') as prev_appraiser_nm,
	ISNULL(prev_u.pacs_user_name,'') as prev_operator,
	ppv.eff_size_acres as prev_acres,
	pmineral_acct.type_of_int as prev_type_of_int,
	ppv.imprv_hstd_val as prev_imp_hs,
	ppv.imprv_non_hstd_val as prev_imp_nhs,
	ppv.land_hstd_val as prev_land_hs,
	ppv.legal_acreage as prev_legal_acres,
	ppv.mineral_int_pct as prev_mineral_int_pct,
	ppv.land_non_hstd_val as prev_land_nhs,
	ppv.map_id as prev_map_id,
	ppv.ag_use_val + ppv.timber_use as prev_prod_use,
	ppv.ag_market + ppv.timber_market as prev_prod_market,
	ppv.market as prev_market,
	ppv.ag_use_val + ppv.timber_use - ppv.ag_market - ppv.timber_market as prev_prod_loss,
	ppv.appraised_val as prev_appraisal_val,
	ppv.ten_percent_cap as prev_hs_cap,
	ppv.assessed_val as prev_assessed_val,
	ppv.prop_inactive_dt as prev_inactive_dt,
	ppv.sup_desc as prev_sup_desc,
	p.dba_name

FROM property_val AS pv
WITH (NOLOCK)

INNER JOIN supplement AS s
WITH (NOLOCK)
ON pv.sup_num = s.sup_num
AND pv.prop_val_yr = s.sup_tax_yr

INNER JOIN property AS p
WITH (NOLOCK)
ON pv.prop_id = p.prop_id

LEFT OUTER JOIN mineral_acct
WITH (NOLOCK)
ON    pv.prop_id = mineral_acct.prop_id

LEFT OUTER JOIN property_val as ppv
WITH (NOLOCK)
ON pv.prop_id = ppv.prop_id
AND pv.prop_val_yr = ppv.prop_val_yr
AND pv.prev_sup_num = ppv.sup_num

LEFT OUTER JOIN mineral_acct as pmineral_acct
WITH (NOLOCK)
ON    ppv.prop_id = pmineral_acct.prop_id

-- JKI changed so that only one recordd will be returned
--LEFT OUTER JOIN situs 
--WITH (NOLOCK)
--ON    pv.prop_id = situs.prop_id
--AND   situs.primary_situs = 'Y'
-- JKI 12-01-2004
left outer join 
(
		select prop_id, max(situs_id) as situs_id
		from situs with(nolock)
		where IsNull(primary_situs,'N') = 'Y'
		group by prop_id
) as si
on si.prop_id=pv.prop_id

left outer join situs with(nolock) on
situs.prop_id=si.prop_id and
situs.situs_id=si.situs_id
-- JKI

LEFT OUTER JOIN mortgage_assoc
WITH (NOLOCK)
ON    pv.prop_id = mortgage_assoc.prop_id

LEFT OUTER JOIN appraiser as curr_a
WITH (NOLOCK)
ON	pv.last_appraiser_id = curr_a.appraiser_id

LEFT OUTER JOIN appraiser as prev_a
WITH (NOLOCK)
ON  ppv.last_appraiser_id = prev_a.appraiser_id

LEFT OUTER JOIN pacs_user as curr_u
WITH (NOLOCK)
ON  pv.last_pacs_user_id = curr_u.pacs_user_id

LEFT OUTER JOIN pacs_user as prev_u
WITH (NOLOCK)
ON  ppv.last_pacs_user_id = prev_u.pacs_user_id

WHERE pv.prop_id = @input_prop_id
and pv.sup_num = @input_sup_num
and pv.prop_val_yr = @input_yr

GO

