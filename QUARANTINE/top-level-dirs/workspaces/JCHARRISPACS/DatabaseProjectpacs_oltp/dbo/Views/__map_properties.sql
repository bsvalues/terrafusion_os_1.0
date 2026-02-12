create view  __map_properties as 
SELECT 	psa.prop_id, psa.owner_tax_yr as prop_val_yr, psa.sup_num FROM prop_supp_assoc psa join property p on p.prop_id = psa.prop_id join pacs_system ps on psa.owner_tax_yr = ps.appr_yr
WHERE p.prop_type_cd in ('R', 'MH')

GO

