
CREATE VIEW dbo.PROPERTY_LINKS_VW
AS
SELECT pa.parent_prop_id, 
    pa.child_prop_id, pt.prop_type_desc, 
    pv.legal_desc, p.dba_name, s.primary_situs,
    s.situs_num, s.situs_street_prefx, s.situs_street,
    s.situs_street_sufix, s.situs_unit, s.situs_city,
    s.situs_state, s.situs_zip, s.situs_display
FROM property_assoc as pa
with (nolock)
join property_val as pv
with (nolock)
on pa.child_prop_id = pv.prop_id
and pa.prop_val_yr = pv.prop_val_yr
and pa.sup_num = pv.sup_num
join property as p
with (nolock)
on pa.child_prop_id = p.prop_id 
JOIN property_type as pt 
ON p.prop_type_cd = pt.prop_type_cd 
JOIN prop_supp_assoc as psa
with (nolock)
ON pv.prop_id = psa.prop_id 
AND pv.sup_num = psa.sup_num 
AND pv.prop_val_yr = psa.owner_tax_yr 
LEFT OUTER JOIN situs as s
ON p.prop_id = s.prop_id 
AND s.primary_situs = 'Y'
WHERE psa.owner_tax_yr IN
	(
		SELECT MAX(owner_tax_yr)
		FROM prop_supp_assoc AS propsa
		with (nolock)
		WHERE propsa.prop_id = pv.prop_id
	)

GO

