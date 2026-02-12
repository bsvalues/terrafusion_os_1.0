


CREATE VIEW dbo.transfer_bill_supp_stmnt_vw
AS
SELECT property_val.land_hstd_val, 
    property_val.land_non_hstd_val, property_val.imprv_hstd_val, 
    property_val.imprv_non_hstd_val, property_val.appraised_val, 
    property_val.assessed_val, property_val.ag_use_val, 
    property_val.ag_market, property_val.timber_use, 
    property_val.timber_loss, property_val.ten_percent_cap, 
    transfer_stmnt_vw.prop_id, transfer_stmnt_vw.owner_id, 
    transfer_stmnt_vw.sup_tax_yr, transfer_stmnt_vw.stmnt_id, 
    transfer_stmnt_vw.sup_num,
    situs.primary_situs, situs.situs_num, situs.situs_street_prefx,
    situs.situs_street, situs.situs_street_sufix, situs.situs_unit,
    situs.situs_city, situs.situs_state, situs.situs_zip, situs.situs_display,
    account.file_as_name, address.addr_line1, 
    address.addr_line2, address.addr_line3, address.addr_city, 
    address.addr_state, address.addr_zip, 
    property_val.legal_desc, property_val.legal_acreage, 
    property_val.timber_market, property.geo_id, 
    owner.pct_ownership, address.country_cd, 
    transfer_stmnt_vw.levy_group_id, 
    transfer_stmnt_vw.levy_run_id, property.prop_type_cd, 
    address.ml_deliverable, property_val.vit_flag
FROM account RIGHT OUTER JOIN
    property_val INNER JOIN
    property ON 
    property_val.prop_id = property.prop_id RIGHT OUTER JOIN
    transfer_stmnt_vw LEFT OUTER JOIN
    owner ON transfer_stmnt_vw.prop_id = owner.prop_id AND 
    transfer_stmnt_vw.owner_id = owner.owner_id AND 
    transfer_stmnt_vw.sup_tax_yr = owner.owner_tax_yr AND 
    transfer_stmnt_vw.sup_num = owner.sup_num LEFT OUTER JOIN
    situs ON transfer_stmnt_vw.prop_id = situs.prop_id AND 
    situs.primary_situs = 'Y' ON 
    property_val.prop_id = transfer_stmnt_vw.prop_id AND 
    property_val.prop_val_yr = transfer_stmnt_vw.sup_tax_yr AND 
    property_val.sup_num = transfer_stmnt_vw.sup_num ON 
    account.acct_id = transfer_stmnt_vw.owner_id LEFT OUTER JOIN
    address ON account.acct_id = address.acct_id AND 
    address.primary_addr = 'Y'

GO

