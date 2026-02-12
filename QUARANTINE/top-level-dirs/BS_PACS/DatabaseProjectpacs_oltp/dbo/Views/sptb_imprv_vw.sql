


CREATE VIEW dbo.sptb_imprv_vw
AS
SELECT imprv.imprv_state_cd, imprv.prop_val_yr, 
    SUM(imprv.imprv_val * entity_prop_assoc.entity_prop_pct / 100
     * owner.pct_ownership / 100) AS imprv_val, 
    entity_prop_assoc.entity_id
FROM property_val INNER JOIN
    prop_supp_assoc ON 
    property_val.prop_id = prop_supp_assoc.prop_id AND 
    property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr AND
     property_val.sup_num = prop_supp_assoc.sup_num INNER JOIN
    imprv ON prop_supp_assoc.prop_id = imprv.prop_id AND 
    prop_supp_assoc.owner_tax_yr = imprv.prop_val_yr AND 
    prop_supp_assoc.sup_num = imprv.sup_num INNER JOIN
    entity_prop_assoc ON 
    prop_supp_assoc.owner_tax_yr = entity_prop_assoc.tax_yr AND
     prop_supp_assoc.sup_num = entity_prop_assoc.sup_num AND
     prop_supp_assoc.prop_id = entity_prop_assoc.prop_id INNER JOIN
    owner ON prop_supp_assoc.prop_id = owner.prop_id AND 
    prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr AND 
    prop_supp_assoc.sup_num = owner.sup_num
WHERE (property_val.prop_inactive_dt IS NULL) AND 
    (imprv.sale_id = 0)
GROUP BY imprv.imprv_state_cd, imprv.prop_val_yr, 
    entity_prop_assoc.entity_id

GO

