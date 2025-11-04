



CREATE VIEW dbo.transfer_appraisal_info_vw
AS
SELECT property.prop_id, property.prop_type_cd, 
    property_val.abs_subdv_cd, property_val.hood_cd, 
    property_val.block, property_val.tract_or_lot, property.geo_id, 
    owner.owner_id, owner.pct_ownership, account.file_as_name, 
    address.primary_addr, address.addr_line1, 
    address.addr_line2, address.addr_line3, address.addr_city, 
    address.addr_state, address.country_cd, address.addr_zip, 
    address.ml_deliverable, property_val.land_hstd_val, 
    property_val.land_non_hstd_val, property_val.imprv_hstd_val, 
    property_val.imprv_non_hstd_val, property_val.appraised_val, 
    property_val.assessed_val, property_val.market, 
    property_val.ag_use_val, property_val.ag_market, 
    property_val.timber_market, property_val.timber_use, 
    property_val.ten_percent_cap, property_val.legal_desc, 
    property_val.legal_desc_2, property_val.legal_acreage, 
    property_val.sup_cd, property_val.sup_desc, 
    property_val.sup_dt, property_val.sup_action, 
    property_val.prop_val_yr, property_val.sup_num, 
    property_val.vit_flag
FROM owner INNER JOIN
    property_val ON owner.prop_id = property_val.prop_id AND 
    owner.owner_tax_yr = property_val.prop_val_yr AND 
    owner.sup_num = property_val.sup_num INNER JOIN
    property ON 
    property_val.prop_id = property.prop_id INNER JOIN
    account ON 
    owner.owner_id = account.acct_id LEFT OUTER JOIN
    address ON account.acct_id = address.acct_id AND 
    address.primary_addr = 'Y'
WHERE (property_val.prop_inactive_dt IS NULL)

GO

