


CREATE VIEW dbo.sales_mult_prop_val_vw
AS
SELECT chg_of_owner_prop_assoc.chg_of_owner_id, 
    COUNT(property_val.prop_id) AS prop_count, 
    SUM(property_val.land_hstd_val + property_val.land_non_hstd_val
     + property_val.ag_market + property_val.timber_market) 
    AS total_land_market, 
    SUM(property_val.imprv_hstd_val + property_val.imprv_non_hstd_val)
     AS total_imp_market, 
    SUM(property_val.land_hstd_val + property_val.land_non_hstd_val
     + property_val.ag_market + property_val.timber_market + property_val.imprv_hstd_val
     + property_val.imprv_non_hstd_val) AS total_market, 
    SUM(property_val.land_hstd_val) AS total_land_hs, 
    SUM(property_val.land_non_hstd_val) AS total_land_nhs, 
    SUM(property_val.imprv_hstd_val) AS total_imp_hs, 
    SUM(property_val.imprv_non_hstd_val) AS total_imp_nhs, 
    SUM(property_val.ag_use_val) AS total_ag_use, 
    SUM(property_val.ag_market) AS total_ag_market, 
    SUM(property_val.timber_market) AS total_timber_market, 
    SUM(property_val.timber_use) AS total_timber_use, 
    chg_of_owner_prop_assoc.sup_tax_yr, 
    SUM(property_val.legal_acreage) AS total_acres
FROM chg_of_owner_prop_assoc INNER JOIN
    prop_supp_assoc ON 
    chg_of_owner_prop_assoc.prop_id = prop_supp_assoc.prop_id AND
     chg_of_owner_prop_assoc.sup_tax_yr = prop_supp_assoc.owner_tax_yr
     INNER JOIN
    property_val ON 
    prop_supp_assoc.prop_id = property_val.prop_id AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num
GROUP BY chg_of_owner_prop_assoc.chg_of_owner_id, 
    chg_of_owner_prop_assoc.sup_tax_yr

GO

