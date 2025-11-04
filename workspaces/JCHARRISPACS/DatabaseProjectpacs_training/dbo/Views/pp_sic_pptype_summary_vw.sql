
CREATE VIEW pp_sic_pptype_summary_vw
AS 

SELECT 
	pv.prop_id as prop_id,
	pv.prop_val_yr as prop_val_yr,
	o.owner_id as owner_id,
	ISNULL(a.confidential_file_as_name, '') as c_taxpayer,
	ISNULL(a.file_as_name, '') as taxpayer,
	REPLACE( ISNULL(s.situs_display, ''), CHAR(13) + CHAR(10), ' ') as situs_address,
	ISNULL(pv.legal_desc, '') as legal_desc,
	ISNULL(s.situs_num, 0) as situs_num,
	ISNULL(s.situs_street, '') as situs_street,
	ISNULL(s.situs_street_sufix, '') as situs_suffix,
	ISNULL(s.situs_street_prefx, '') as situs_prefix,
	ISNULL(s.situs_unit,   '') as situs_unit,
	ISNULL(s.situs_state,  '') as situs_state,
	ISNULL(p.dba_name, '') as dba_name,
	ISNULL(a.confidential_flag, 'F') as confidential_flag,
	p.prop_sic_cd as sic_cd,
	pps.pp_seg_id as pp_seg_id,
	pps.pp_type_cd as pp_type_cd,
	pps.pp_area as seg_area,
	CASE 
		WHEN ppr.prop_id IS NULL 
		THEN 'N' ELSE 'Y' 
	END as rend,	
	
	CASE pps.pp_appraise_meth
		WHEN 'SUB' THEN 'SS'
		WHEN 'O' THEN 'OC'
		WHEN 'F' THEN 'FV'
		WHEN 'R' THEN 'RV'
		WHEN 'A' THEN 'AV'
		ELSE pps.pp_appraise_meth 		 
	END as pps_appraised_method,
	(
		CAST
		(
			(	
			CASE 
				WHEN pps.pp_appraise_meth = 'SUB' THEN ISNULL(pps.pp_subseg_val,0)
				WHEN pps.pp_appraise_meth = 'O'	THEN ISNULL(pps.pp_orig_cost, 0)
				WHEN pps.pp_appraise_meth = 'F' THEN ISNULL (pps.pp_flat_val, 0)
				WHEN pps.pp_appraise_meth = 'R' THEN ISNULL (pps.pp_rendered_val, 0)
				WHEN pps.pp_appraise_meth = 'A' THEN ISNULL (pps.pp_appraised_val, 0)
				WHEN pps.pp_appraise_meth = 'SP' THEN ISNULL (pps.pp_special_val, 0)		 
			END 
			) AS NUMERIC(18,4)
		)
	) AS pps_value,
	ISNULL(pps.pp_qual_cd, '') as quality_cd,
	ISNULL(pps.pp_density_cd, '') as density_cd	
	


--	(
--	pps_value 
--	/
--		(
--		CASE
--			WHEN seg_area IS NULL THEN 1
--			WHEN seg_area = 0 THEN 1
--			ELSE seg_area
--		END
--		)
--	) AS pps_val_per_sqft
		
	
FROM 
	property_val AS pv
	INNER JOIN 
	prop_supp_assoc as psa
		ON psa.prop_id = pv.prop_id
		AND psa.owner_tax_yr = pv.prop_val_yr
		AND psa.sup_num = pv.sup_num
	INNER JOIN 
	property as p
		ON p.prop_id = pv.prop_id
	INNER JOIN
	owner as o
		ON o.prop_id = pv.prop_id
		AND o.owner_tax_yr = pv.prop_val_yr
		AND o.sup_num = pv.sup_num
	INNER JOIN 
	account as a
		ON o.owner_id = a.acct_id	
	INNER JOIN 
	pers_prop_seg as pps 
		ON pps.prop_id = pv.prop_id
		AND pps.prop_val_yr = pv.prop_val_yr
		AND pps.sup_num = pv.sup_num
		AND pps.pp_active_flag = 'T'
		AND pps.sale_id IS NOT NULL
	LEFT OUTER JOIN 
	situs as s
		ON s.prop_id = pv.prop_id
		AND s.primary_situs = 'Y'
	LEFT OUTER JOIN 
	property_profile as pp
		ON pp.prop_id = pv.prop_id
		AND pp.prop_val_yr = pv.prop_val_yr	
	LEFT OUTER JOIN 
		pers_prop_rendition as ppr
		ON ppr.prop_id = pps.prop_id
		AND ppr.rendition_year = pps.prop_val_yr 
		
WHERE pv.prop_inactive_dt IS NULL AND p.prop_type_cd = 'P'

GO

