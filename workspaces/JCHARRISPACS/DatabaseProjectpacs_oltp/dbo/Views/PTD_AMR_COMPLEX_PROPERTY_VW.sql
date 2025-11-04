







CREATE VIEW dbo.PTD_AMR_COMPLEX_PROPERTY_VW
AS
SELECT DISTINCT 
    prop_supp_assoc.prop_id, prop_supp_assoc.owner_tax_yr, 
    land_detail.state_cd AS land_state_cd, 
    imprv.imprv_state_cd
FROM prop_supp_assoc INNER JOIN
    imprv ON prop_supp_assoc.prop_id = imprv.prop_id AND 
    prop_supp_assoc.owner_tax_yr = imprv.prop_val_yr AND 
    prop_supp_assoc.sup_num = imprv.sup_num INNER JOIN
    land_detail ON 
    prop_supp_assoc.prop_id = land_detail.prop_id AND 
    prop_supp_assoc.owner_tax_yr = land_detail.prop_val_yr AND 
    prop_supp_assoc.sup_num = land_detail.sup_num
WHERE land_detail.state_cd <> imprv.imprv_state_cd

GO

