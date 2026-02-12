

create view [dbo].[New_Construction_all] as
SELECT DISTINCT pv.prop_id, a.file_as_name, ta.tax_area_number,	pv.prop_val_yr,
(wpov.new_val_hs + wpov.new_val_nhs + wpov.new_val_p) as New_Value	
FROM property_val pv WITH (nolock)	
INNER JOIN prop_supp_assoc psa WITH (nolock) ON	
	pv.prop_id = psa.prop_id
	AND pv.prop_val_yr = psa.owner_tax_yr
	AND pv.sup_num = psa.sup_num
INNER JOIN owner o WITH (nolock) ON 	
	pv.prop_id = o.prop_id
	AND pv.prop_val_yr = o.owner_tax_yr
	AND pv.sup_num = o.sup_num
INNER JOIN account a WITH (nolock) ON	
	o.owner_id = a.acct_id
INNER JOIN  wash_prop_owner_val wpov WITH (nolock) ON	
	pv.prop_id = wpov.prop_id
	AND pv.prop_val_yr = wpov.year
	AND pv.sup_num = wpov.sup_num
	AND o.owner_id = wpov.owner_id
INNER JOIN property_tax_area pta WITH(nolock) ON
    pv.prop_id = pta.prop_id
    AND pv.sup_num = pta.sup_num 
    AND pv.prop_val_yr = pta.year
INNER JOIN tax_area ta WITH(nolock) ON
    pta.tax_area_id = ta.tax_area_id

WHERE --pv.prop_val_yr = (select appr_yr-1  from [pacs_oltp].[dbo].pacs_system) 
--AND 
(prop_inactive_dt is null or udi_parent = 'T')	
AND (wpov.new_val_hs + wpov.new_val_nhs + wpov.new_val_p) > 0	
--ORDER BY ta.tax_area_number, a.file_as_name	

GO

