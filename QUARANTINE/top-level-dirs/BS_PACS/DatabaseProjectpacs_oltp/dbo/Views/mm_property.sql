create view mm_property as

SELECT pv1.[last_appraiser_id] 

 ,pv1.[prop_id] 

 ,pv1.[map_id] 

 ,pv1.[cycle] 

 ,pv1.[rgn_cd] 

 ,p1.[geo_id] 

 ,pp1.[neighborhood] 

 ,oev1.[file_as_name] 

FROM dbo.prop_supp_assoc AS psa1 WITH (NOLOCK) 

JOIN dbo.property AS p1 WITH (NOLOCK) ON p1.[prop_id] = 
psa1.[prop_id] 

JOIN dbo.property_profile AS pp1 WITH (NOLOCK) ON 
pp1.[prop_id] = psa1.[prop_id] 

 AND pp1.[prop_val_yr] = psa1.[owner_tax_yr] 

JOIN dbo.property_val AS pv1 WITH (NOLOCK) ON pv1.[prop_id] 
= psa1.[prop_id] 

 AND pv1.[prop_val_yr] = psa1.[owner_tax_yr] 

 AND pv1.[sup_num] = psa1.[sup_num] 

JOIN dbo.query_builder_owner_everything_vw AS oev1 WITH 
(NOLOCK) ON oev1.[owner_tax_yr] = psa1.[owner_tax_yr] 

 AND oev1.[prop_id] = psa1.[prop_id] 

 AND oev1.[sup_num] = psa1.[sup_num] 

JOIN dbo.query_builder_owner_vw AS o1 WITH (NOLOCK) ON 
o1.[owner_tax_yr] = psa1.[owner_tax_yr] 

 AND o1.[prop_id] = psa1.[prop_id] 

 AND o1.[sup_num] = psa1.[sup_num] 

INNER JOIN pacs_system ON pv1.prop_val_yr = 
pacs_system.appr_yr 

WHERE pv1.[prop_inactive_dt] IS NULL

GO

