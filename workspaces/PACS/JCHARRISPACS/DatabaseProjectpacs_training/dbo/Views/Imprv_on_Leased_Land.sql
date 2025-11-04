
CREATE VIEW Imprv_on_Leased_Land
AS
SELECT DISTINCT pv.prop_id AS Lease_Hold_Prop_ID, 
p.geo_id AS Lease_Hold_Geo_ID, 
p.prop_type_cd, 
pa.child_prop_id AS Linked_Real_Prop_ID, 
pa1.geo_id AS Linked_Real_Geo_ID, 
ac.file_as_name
FROM property_val pv WITH (nolock) 
INNER JOIN prop_supp_assoc psa WITH (nolock) ON 
	pv.prop_id = psa.prop_id 
	AND pv.prop_val_yr = psa.owner_tax_yr 
	AND pv.sup_num = psa.sup_num 
INNER JOIN property p WITH (nolock) ON 
	pv.prop_id = p.prop_id 
INNER JOIN owner o WITH (nolock) ON 
	pv.prop_id = o.prop_id 
	AND pv.prop_val_yr = o.owner_tax_yr 
	AND pv.sup_num = o.sup_num 
INNER JOIN account ac WITH (nolock) ON 
	o.owner_id = ac.acct_id 
INNER JOIN property_assoc pa WITH (nolock) ON 
	pv.prop_id = pa.parent_prop_id 
	AND pv.prop_val_yr = pa.prop_val_yr 
INNER JOIN property pa1 WITH (nolock) ON 
	pa1.prop_id = pa.child_prop_id
WHERE pv.prop_val_yr = 2020
AND pv.prop_inactive_dt IS NULL 
AND (p.geo_id LIKE '7%' or p.geo_id like '8%') 
AND (pa.child_prop_id IN (SELECT prop_id
                          FROM property
                          WHERE prop_type_cd = 'R'))

GO

