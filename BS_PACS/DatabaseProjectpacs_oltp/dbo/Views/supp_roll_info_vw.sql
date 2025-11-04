




CREATE VIEW dbo.supp_roll_info_vw
AS
SELECT property_val.prop_id, property_val.prop_val_yr, 
    property_val.sup_num AS curr_sup_num, 
    property_val.land_hstd_val AS curr_land_hs, 
    property_val.land_non_hstd_val AS curr_land_nhs, 
    property_val.imprv_hstd_val AS curr_imprv_hs, 
    property_val.imprv_non_hstd_val AS curr_imprv_nhs, 
    property_val.appraised_val AS curr_appr, 
    property_val.ag_use_val AS curr_ag_use, 
    property_val.ag_market AS curr_ag_mkt, 
    property_val.timber_market AS curr_timb_mkt, 
    property_val.timber_use AS curr_timb_use, 
    property_val.legal_desc AS curr_legal_desc, 
    property_val.legal_acreage AS curr_legal_acre, 
    owner.pct_ownership, owner.owner_id, 
    property_val.sup_action AS curr_sup_action, 
    property_val.sup_desc AS curr_sup_desc, 
    property_val.sup_cd AS curr_sup_cd, 
    property_val1.land_hstd_val AS prev_land_hs, 
    property_val1.land_non_hstd_val AS prev_land_nhs, 
    property_val1.imprv_hstd_val AS prev_imprv_hs, 
    property_val1.imprv_non_hstd_val AS prev_imprv_nhs, 
    property_val1.appraised_val AS prev_appr, 
    property_val1.ag_use_val AS prev_ag_use, 
    property_val1.ag_market AS prev_ag_mkt, 
    property_val1.timber_use AS prev_timb_use, 
    property_val1.timber_market AS prev_timb_mkt, 
    supplement.sup_group_id, 
    owner1.pct_ownership AS prev_pct_ownership, 
    property_val.prev_sup_num, 
    property_val.ten_percent_cap AS curr_hs_cap, 
    property_val1.ten_percent_cap AS prev_hs_cap, 
    property_val.assessed_val AS curr_assessed, 
    property_val1.assessed_val AS prev_assessed
FROM property_val INNER JOIN
    owner ON property_val.prop_id = owner.prop_id AND 
    property_val.prop_val_yr = owner.owner_tax_yr AND 
    property_val.sup_num = owner.sup_num INNER JOIN
    supplement ON 
    property_val.sup_num = supplement.sup_num AND 
    property_val.prop_val_yr = supplement.sup_tax_yr LEFT OUTER
     JOIN
    property_val property_val1 ON 
    property_val.prop_id = property_val1.prop_id AND 
    property_val.prop_val_yr = property_val1.prop_val_yr AND 
    property_val.prev_sup_num = property_val1.sup_num LEFT OUTER
     JOIN
    owner owner1 ON property_val.prop_id = owner1.prop_id AND 
    property_val.prop_val_yr = owner1.owner_tax_yr AND 
    property_val.prev_sup_num = owner1.sup_num AND 
    owner.owner_id = owner1.owner_id

GO

