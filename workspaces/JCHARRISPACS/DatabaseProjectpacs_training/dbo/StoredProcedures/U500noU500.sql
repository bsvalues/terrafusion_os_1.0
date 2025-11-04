
--monitor command {call U500noU500} 
						
CREATE PROCEDURE [dbo].[U500noU500]

as

SELECT DISTINCT pv.prop_id, p.geo_id, p.prop_type_cd, ac.file_as_name, pv.legal_desc,
dbo.fn_GetExemptions(pv.prop_id, pv.prop_val_yr, pv.sup_num) as Exemptions, 
dbo.fn_getPropGroupCodes(pv.prop_id) as Group_Codes,
pv.market, pv.assessed_val, pv.prop_val_yr
FROM property_val pv WITH (nolock)
INNER JOIN property p WITH (nolock) ON
	pv.prop_id = p.prop_id
INNER JOIN prop_supp_assoc psa WITH (nolock) ON
	pv.prop_id = psa.prop_id 
	AND pv.prop_val_yr = psa.owner_tax_yr 
	AND pv.sup_num = psa.sup_num
INNER JOIN owner o WITH (nolock) ON
	pv.prop_id = o.prop_id
	AND pv.sup_num = o.sup_num
	AND pv.prop_val_yr = o.owner_tax_yr
INNER JOIN account ac WITH (nolock) ON 
	o.owner_id = ac.acct_id
INNER JOIN pacs_system ps WITH (nolock) ON 
	pv.prop_val_yr = ps.appr_yr
WHERE pv.prop_val_yr = 2012 
AND pv.prop_inactive_dt is null
--AND p.prop_type_cd = 'R'
AND pv.assessed_val < 500
AND dbo.fn_GetExemptions(pv.prop_id, pv.prop_val_yr, pv.sup_num) not in ('U500', 'EX')
ORDER BY ac.file_as_name

GO

