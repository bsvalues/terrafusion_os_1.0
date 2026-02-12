
CREATE VIEW dbo.TAX_CEILING_CERTIFICATE_VW
AS
SELECT
	pf.prop_id,
	pf.owner_id,
	pf.entity_id,
	pf.exmpt_tax_yr,
	pf.owner_tax_yr,
	p.prop_type_cd,
	pf.exmpt_type_cd,
	et.exmpt_desc,
	e.entity_cd,
	ea.file_as_name as entity_name,
	pv.legal_desc,
	oa.file_as_name,
	oa.confidential_file_as_name,
	p.geo_id,
	pf.sup_num,
	sa.addr_line2,
	sa.addr_line3,
	sa.city,
	sa.state,
	sa.zip,
	sa.phone_num,
	sa.office_name
FROM
	property_freeze as pf with (nolock)
INNER JOIN
	entity as e with (nolock)
ON
	pf.entity_id = e.entity_id
INNER JOIN
	entity_exmpt as ee with (nolock)
ON
	pf.entity_id = ee.entity_id
AND	pf.exmpt_type_cd = ee.exmpt_type_cd
AND	pf.owner_tax_yr = ee.exmpt_tax_yr
AND	pf.exmpt_tax_yr = ee.exmpt_tax_yr
AND	ee.freeze_flag = 1
INNER JOIN
	account as ea with (nolock)
ON
	pf.entity_id = ea.acct_id
INNER JOIN
	account as oa with (nolock)
ON
	pf.owner_id = oa.acct_id
INNER JOIN
	exmpt_type as et with (nolock)
on
	pf.exmpt_type_cd = et.exmpt_type_cd
INNER JOIN
	property_val as pv with (nolock)
ON
	pf.prop_id = pv.prop_id
AND	pf.owner_tax_yr = pv.prop_val_yr
AND	pf.exmpt_tax_yr = pv.prop_val_yr
AND	pf.sup_num = pv.sup_num
INNER JOIN
	property as p with (nolock)
ON
	pf.prop_id = p.prop_id
CROSS JOIN
	system_address as sa with (nolock)
WHERE
	
	sa.system_type = 'A'

GO

