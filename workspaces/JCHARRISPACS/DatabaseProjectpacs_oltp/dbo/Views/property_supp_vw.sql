













CREATE VIEW dbo.property_supp_vw
AS
SELECT supplement.sup_group_id, property_val.prop_id, 
    property_val.prop_val_yr, property_val.sup_num, 
    property_val.sup_cd, property_val.sup_desc, 
    property_val.sup_dt, property_val.sup_action
FROM property_val INNER JOIN
    supplement ON 
    property_val.sup_num = supplement.sup_num AND 
    property_val.prop_val_yr = supplement.sup_tax_yr

GO

