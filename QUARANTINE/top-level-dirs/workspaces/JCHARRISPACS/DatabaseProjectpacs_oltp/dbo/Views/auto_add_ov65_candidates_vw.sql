

CREATE    VIEW dbo.auto_add_ov65_candidates_vw
AS
SELECT DISTINCT
	pe.prop_id, 
	pv.udi_parent_prop_id, 
	pe.owner_id, 
	pe.sup_num, 
	pe.owner_tax_yr, 
	ac.file_as_name, 
	pe.birth_dt, 
	pe.spouse_birth_dt, 
	ad.addr_line1, 
	ad.addr_line2, 
	ad.addr_line3, 
	ad.addr_city, 
	ad.addr_state, 
	ad.addr_zip, 
	p.exmpt_reset, 
	1 as ntype,	-- has 'HS', but not 'OV65S', 'OV65', or 'DP'
	dbo.fn_GetExemptions(pe.prop_id, pe.owner_tax_yr, pe.sup_num) AS stype

FROM	dbo.property_exemption pe WITH (nolock)
INNER JOIN dbo.property_val pv WITH (nolock)
	ON pv.prop_id = pe.prop_id 
	AND pv.prop_val_yr = pe.owner_tax_yr 
	AND pv.sup_num = pe.sup_num
INNER JOIN dbo.property p WITH (nolock)
	ON pe.prop_id = p.prop_id 
INNER JOIN dbo.account ac WITH (nolock)
	ON pe.owner_id = ac.acct_id 
INNER JOIN dbo.address ad WITH (nolock)
	ON ad.acct_id = pe.owner_id 

WHERE   pe.exmpt_type_cd = 'HS' 
AND	(
		(pe.owner_tax_yr - ISNULL(YEAR(pe.birth_dt), pe.owner_tax_yr) >= 65)
		OR
		(pe.owner_tax_yr - ISNULL(YEAR(pe.spouse_birth_dt), pe.owner_tax_yr) >= 65)
	) 
AND NOT EXISTS (
	SELECT *
	FROM property_exemption s WITH (nolock)
	WHERE s.exmpt_type_cd IN ('OV65S', 'OV65', 'DP') 
	AND s.prop_id = pe.prop_id 
	AND s.owner_id = pe.owner_id 
	AND s.owner_tax_yr = pe.owner_tax_yr
)

UNION

SELECT  DISTINCT
	pe.prop_id, 
	pv.udi_parent_prop_id, 
	pe.owner_id, 
	pe.sup_num, 
	pe.owner_tax_yr, 
	ac.file_as_name, 
	pe.birth_dt, 
	pe.spouse_birth_dt, 
	ad.addr_line1, 
	ad.addr_line2, 
	ad.addr_line3, 
	ad.addr_city, 
	ad.addr_state, 
	ad.addr_zip, 
	p.exmpt_reset, 
	2 as ntype,	-- has 'HS' and 'OV65S', but not 'OV65' or 'DP'
	dbo.fn_GetExemptions(pe.prop_id, pe.owner_tax_yr, pe.sup_num) AS stype

FROM	dbo.property_exemption pe WITH (nolock)
INNER JOIN dbo.property_val pv WITH (nolock)
	ON pv.prop_id = pe.prop_id 
	AND pv.prop_val_yr = pe.owner_tax_yr 
	AND pv.sup_num = pe.sup_num
INNER JOIN dbo.property p WITH (nolock)
	ON pe.prop_id = p.prop_id 
INNER JOIN dbo.account ac WITH (nolock)
	ON pe.owner_id = ac.acct_id 
INNER JOIN dbo.address ad WITH (nolock)
	ON ad.acct_id = pe.owner_id 

WHERE   pe.exmpt_type_cd = 'HS' 
AND	(
		(pe.owner_tax_yr - ISNULL(YEAR(pe.birth_dt), pe.owner_tax_yr) >= 65)
		OR
		(pe.owner_tax_yr - ISNULL(YEAR(pe.spouse_birth_dt), pe.owner_tax_yr) >= 65)
	) 
AND EXISTS (
	SELECT *
	FROM property_exemption s2 WITH (nolock)
	WHERE s2.exmpt_type_cd = 'OV65S' 
	AND s2.prop_id = pe.prop_id 
	AND s2.owner_id = pe.owner_id 
	AND s2.owner_tax_yr = pe.owner_tax_yr
) 
AND NOT EXISTS (
	SELECT *
	FROM property_exemption s3 WITH (nolock)
	WHERE s3.exmpt_type_cd IN ('OV65', 'DP') 
	AND s3.prop_id = pe.prop_id 
	AND s3.owner_id = pe.owner_id 
	AND s3.owner_tax_yr = pe.owner_tax_yr
) 

UNION

SELECT  DISTINCT
	pe.prop_id, 
	pv.udi_parent_prop_id, 
	pe.owner_id, 
	pe.sup_num, 
	pe.owner_tax_yr, 
	ac.file_as_name, 
	pe.birth_dt, 
	pe.spouse_birth_dt, 
	ad.addr_line1, 
	ad.addr_line2, 
	ad.addr_line3, 
	ad.addr_city, 
	ad.addr_state, 
	ad.addr_zip, 
	p.exmpt_reset, 
	3 as ntype,	-- has 'HS' and 'DP', 'OV65' and 'OV65S' not checked, but should not exist if 'DP' exists.
	dbo.fn_GetExemptions(pe.prop_id, pe.owner_tax_yr, pe.sup_num) AS stype

FROM	dbo.property_exemption pe WITH (nolock)
INNER JOIN dbo.property_val pv WITH (nolock)
	ON pv.prop_id = pe.prop_id 
	AND pv.prop_val_yr = pe.owner_tax_yr 
	AND pv.sup_num = pe.sup_num
INNER JOIN dbo.property p WITH (nolock)
	ON pe.prop_id = p.prop_id 
INNER JOIN dbo.account ac WITH (nolock)
	ON pe.owner_id = ac.acct_id 
INNER JOIN dbo.address ad WITH (nolock)
	ON ad.acct_id = pe.owner_id 

WHERE   pe.exmpt_type_cd = 'HS' 
AND	(
		(pe.owner_tax_yr - ISNULL(YEAR(pe.birth_dt), pe.owner_tax_yr) >= 65)
		OR
		(pe.owner_tax_yr - ISNULL(YEAR(pe.spouse_birth_dt), pe.owner_tax_yr) >= 65)
	) 
AND EXISTS (
	SELECT *
	FROM property_exemption s4 WITH (nolock)
	WHERE s4.exmpt_type_cd = 'DP'
	AND s4.prop_id = pe.prop_id 
	AND s4.owner_id = pe.owner_id 
	AND s4.owner_tax_yr = pe.owner_tax_yr
)

UNION

SELECT  DISTINCT
	pe.prop_id, 
	pv.udi_parent_prop_id, 
	pe.owner_id, 
	pe.sup_num, 
	pe.owner_tax_yr, 
	ac.file_as_name, 
	pe.birth_dt, 
	pe.spouse_birth_dt, 
	ad.addr_line1, 
	ad.addr_line2, 
	ad.addr_line3, 
	ad.addr_city, 
	ad.addr_state, 
	ad.addr_zip, 
	p.exmpt_reset, 
	4 as ntype,	-- has 'HS' and 'OV65' or 'OV65S'. 'DP' not checked, but should not exist if 'OV65' exists.
	dbo.fn_GetExemptions(pe.prop_id, pe.owner_tax_yr, pe.sup_num) AS stype

FROM	dbo.property_exemption pe WITH (nolock)
INNER JOIN dbo.property_val pv WITH (nolock)
	ON pv.prop_id = pe.prop_id 
	AND pv.prop_val_yr = pe.owner_tax_yr 
	AND pv.sup_num = pe.sup_num
INNER JOIN dbo.property p WITH (nolock)
	ON pe.prop_id = p.prop_id 
INNER JOIN dbo.account ac WITH (nolock)
	ON pe.owner_id = ac.acct_id 
INNER JOIN dbo.address ad WITH (nolock)
	ON ad.acct_id = pe.owner_id 

WHERE   pe.exmpt_type_cd = 'HS' 
AND	(
		(pe.owner_tax_yr - ISNULL(YEAR(pe.birth_dt), pe.owner_tax_yr) >= 65)
		OR
		(pe.owner_tax_yr - ISNULL(YEAR(pe.spouse_birth_dt), pe.owner_tax_yr) >= 65)
	) 
AND EXISTS (
	SELECT *
	FROM property_exemption s5 WITH (nolock)
	WHERE s5.exmpt_type_cd = 'OV65' 
	AND s5.prop_id = pe.prop_id 
	AND s5.owner_id = pe.owner_id 
	AND s5.owner_tax_yr = pe.owner_tax_yr
)

GO

