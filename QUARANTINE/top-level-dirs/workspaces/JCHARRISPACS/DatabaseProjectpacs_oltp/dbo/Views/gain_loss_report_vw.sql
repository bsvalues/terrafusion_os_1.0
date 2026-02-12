
CREATE VIEW gain_loss_report_vw

AS

SELECT epa.entity_id, 
		e.entity_cd, 
		ea.file_as_name as entity_name, 
		p.prop_type_cd, 
		p.prop_id, 
		pv.abs_subdv_cd, 
		p.geo_id, 
		pv.legal_desc, 
		a.file_as_name as owner_name, 
		pv.appraised_val as curr_appraised_val, 
		ppv.appraised_val as prev_appraised_val, 
		pv.appraised_val - ppv.appraised_val as gain_loss,
		pv.assessed_val,
		pv.prop_val_yr,
		pv.prop_inactive_dt,
		pv.hood_cd,
		pp.imprv_type_cd,
		case when pv.appraised_val>0 then ROUND((((pv.appraised_val - ppv.appraised_val)/pv.appraised_val)*100.0),2) else 0 end as pct_change

FROM property_val as pv 
WITH (NOLOCK) 

INNER JOIN prop_supp_assoc as psa 
WITH (NOLOCK) 
ON pv.prop_id = psa.prop_id 
AND pv.prop_val_yr = psa.owner_tax_yr 
AND pv.sup_num = psa.sup_num 

INNER JOIN owner as o 
WITH (NOLOCK) 
ON pv.prop_id = o.prop_id 
AND pv.prop_val_yr = o.owner_tax_yr 
AND pv.sup_num = o.sup_num 

INNER JOIN account as a 
WITH (NOLOCK) 
ON o.owner_id = a.acct_id 

INNER JOIN property as p 
WITH (NOLOCK) 
ON pv.prop_id = p.prop_id 

INNER JOIN prop_supp_assoc as ppsa 
WITH (NOLOCK) 
ON pv.prop_id = ppsa.prop_id 
AND pv.prop_val_yr -1 = ppsa.owner_tax_yr 

INNER JOIN property_val as ppv 
WITH (NOLOCK) 
ON ppsa.prop_id = ppv.prop_id 
AND ppsa.owner_tax_yr = ppv.prop_val_yr 
AND ppsa.sup_num = ppv.sup_num 

INNER JOIN entity_prop_assoc as epa 
WITH (NOLOCK) 
ON pv.prop_id = epa.prop_id 
AND pv.prop_val_yr = epa.tax_yr 
AND pv.sup_num = epa.sup_num 

INNER JOIN entity as e 
WITH (NOLOCK) 
ON epa.entity_id = e.entity_id 

INNER JOIN account as ea 
WITH (NOLOCK) 
ON epa.entity_id = ea.acct_id 

LEFT OUTER JOIN property_profile as pp
WITH (NOLOCK)
ON pv.prop_id = pp.prop_id 
AND pv.prop_val_yr = pp.prop_val_yr 
AND pv.sup_num = pp.sup_num

GO

