







CREATE VIEW dbo.PTD_AMR_VW
AS
SELECT property.prop_id, property.state_cd, 
    prop_supp_assoc.owner_tax_yr, 
    property_val.prop_inactive_dt, property_val.appraised_val, 
    property.prop_type_cd, property_val.ten_percent_cap, 
    property_val.last_appraisal_yr
FROM prop_supp_assoc INNER JOIN
    property_val ON 
    prop_supp_assoc.prop_id = property_val.prop_id AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num INNER JOIN
    property ON 
    prop_supp_assoc.prop_id = property.prop_id
WHERE (property_val.prop_inactive_dt IS NULL)

GO

