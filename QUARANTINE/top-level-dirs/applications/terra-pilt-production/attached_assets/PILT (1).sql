--irrigated acres

SELECT DISTINCT pv.prop_id, p.geo_id, ld.land_type_cd,
ld.size_acres, ld.mkt_val_source, ld.land_seg_mkt_val,
ld.mkt_flat_val, ld.mkt_adj_val
FROM property_val pv WITH (nolock)
INNER JOIN prop_supp_assoc psa WITH (nolock) ON
	pv.prop_id = psa.prop_id
	AND pv.prop_val_yr = psa.owner_tax_yr
	AND pv.sup_num = psa.sup_num
INNER JOIN property p WITH (nolock) ON
	pv.prop_id = p.prop_id 
INNER JOIN land_detail ld WITH (nolock) ON
	pv.prop_id = ld.prop_id
	AND pv.prop_val_yr = ld.prop_val_yr
	AND pv.sup_num = ld.sup_num
	AND ld.sale_id = 0
	AND ld.land_type_cd in ('4', '41', '42', '45', '46', '47')---you can change/add codes as needed
WHERE pv.prop_val_yr = 2018---you can change the year as needed
AND pv.prop_inactive_dt is null
AND pv.prop_id not in (select prop_id
					   from property_exemption
				       where exmpt_tax_yr = 2018---change year to match the above year
				       and exmpt_type_cd in ('SNR/DSBL', 'EX'))
ORDER BY p.geo_id


--dry acres

SELECT DISTINCT pv.prop_id, p.geo_id, ld.land_type_cd,
ld.size_acres, ld.mkt_val_source, ld.land_seg_mkt_val,
ld.mkt_flat_val, ld.mkt_adj_val
FROM property_val pv WITH (nolock)
INNER JOIN prop_supp_assoc psa WITH (nolock) ON
	pv.prop_id = psa.prop_id
	AND pv.prop_val_yr = psa.owner_tax_yr
	AND pv.sup_num = psa.sup_num
INNER JOIN property p WITH (nolock) ON
	pv.prop_id = p.prop_id 
INNER JOIN land_detail ld WITH (nolock) ON
	pv.prop_id = ld.prop_id
	AND pv.prop_val_yr = ld.prop_val_yr
	AND pv.sup_num = ld.sup_num
	AND ld.sale_id = 0
	AND ld.land_type_cd in ('5', '51')---you can change/add codes as needed
WHERE pv.prop_val_yr = 2018---you can change the year as needed
AND pv.prop_inactive_dt is null
AND pv.prop_id not in (select prop_id
					   from property_exemption
				       where exmpt_tax_yr = 2018---change year to match the above year
				       and exmpt_type_cd in ('SNR/DSBL', 'EX'))
ORDER BY p.geo_id


--exempt parcels

SELECT DISTINCT pv.prop_id, p.geo_id, pv.cycle,
dbo.fn_GetExemptions(pv.prop_id, pv.prop_val_yr, pv.sup_num) as Exemptions
FROM property_val pv WITH (nolock)
INNER JOIN prop_supp_assoc psa WITH (nolock) ON
	pv.prop_id = psa.prop_id
	AND pv.prop_val_yr = psa.owner_tax_yr
	AND pv.sup_num = psa.sup_num
INNER JOIN property p WITH (nolock) ON
	pv.prop_id = p.prop_id 
INNER JOIN land_detail ld WITH (nolock) ON
	pv.prop_id = ld.prop_id
	AND pv.prop_val_yr = ld.prop_val_yr
	AND pv.sup_num = ld.sup_num
	AND ld.sale_id = 0
WHERE pv.prop_val_yr = 2018---you can change the year as needed
AND pv.prop_inactive_dt is null
AND pv.prop_id in (select prop_id
				   from property_exemption
				   where exmpt_tax_yr = 2018---change year to match the above year
				   and exmpt_type_cd in ('SNR/DSBL', 'EX'))
ORDER BY p.geo_id


--City County acres

SELECT DISTINCT pv.prop_id, p.geo_id, ld.land_type_cd,
ld.state_cd, ld.size_acres, ld.size_square_feet, 
ld.mkt_val_source, ld.land_seg_mkt_val, ld.mkt_flat_val, 
ld.mkt_adj_val, ta.tax_area_number
FROM property_val pv WITH (nolock)
INNER JOIN prop_supp_assoc psa WITH (nolock) ON
	pv.prop_id = psa.prop_id
	AND pv.prop_val_yr = psa.owner_tax_yr
	AND pv.sup_num = psa.sup_num
INNER JOIN property p WITH (nolock) ON
	pv.prop_id = p.prop_id 
INNER JOIN land_detail ld WITH (nolock) ON
	pv.prop_id = ld.prop_id
	AND pv.prop_val_yr = ld.prop_val_yr
	AND pv.sup_num = ld.sup_num
	AND ld.sale_id = 0
INNER JOIN property_tax_area pta WITH (nolock) ON
	pv.prop_id = pta.prop_id
	AND pv.prop_val_yr = pta.year
	AND pv.sup_num = pta.sup_num
INNER JOIN tax_area ta WITH (nolock) ON
	pta.tax_area_id = ta.tax_area_id
	AND ta.tax_area_number not like '1%'
WHERE pv.prop_val_yr = 2018---you can change the year as needed
AND pv.prop_inactive_dt is null
AND pv.prop_id not in (select prop_id
					   from property_exemption
				       where exmpt_tax_yr = 2018---change year to match the above year
				       and exmpt_type_cd in ('SNR/DSBL', 'EX'))
ORDER BY ta.tax_area_number, p.geo_id