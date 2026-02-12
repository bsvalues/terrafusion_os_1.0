









CREATE VIEW dbo.sptb_prop_state_vw
AS
SELECT state_code.state_cd, prop_supp_assoc.prop_id, 
    prop_supp_assoc.owner_tax_yr, 
    prop_supp_assoc.sup_num
FROM property_val INNER JOIN
    prop_supp_assoc ON 
    property_val.prop_id = prop_supp_assoc.prop_id AND 
    property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr AND
     property_val.sup_num = prop_supp_assoc.sup_num, 
    state_code

GO

