


CREATE VIEW dbo.arb_notice_of_protest_info_vw
AS
SELECT account.file_as_name, address.addr_line1, 
    address.addr_line2, address.addr_line3, address.addr_city, 
    address.addr_state, address.country_cd, address.addr_zip, 
    property.geo_id, property_val.legal_desc, 
    phone.phone_num AS home_phone_num, 
    phone1.phone_num AS bus_phone_num, 
    property.prop_type_cd, property_val.land_hstd_val, 
    property_val.land_non_hstd_val, property_val.imprv_hstd_val, 
    property_val.imprv_non_hstd_val, property_val.assessed_val, 
    property_val.market, property_val.ag_use_val, 
    property_val.ag_market, property_val.timber_market, 
    appr_notice_config_maint.arb_location, owner.owner_id, 
    owner.owner_tax_yr, owner.prop_id
FROM owner INNER JOIN
    account ON owner.owner_id = account.acct_id INNER JOIN
    address ON account.acct_id = address.acct_id INNER JOIN
    property ON owner.prop_id = property.prop_id INNER JOIN
    property_val ON property.prop_id = property_val.prop_id AND 
    owner.owner_tax_yr = property_val.prop_val_yr INNER JOIN
    appr_notice_config_maint ON 
    owner.owner_tax_yr = appr_notice_config_maint.notice_yr LEFT
     OUTER JOIN
    phone ON account.acct_id = phone.acct_id AND 
    phone.phone_type_cd = 'H' LEFT OUTER JOIN
    phone phone1 ON account.acct_id = phone1.acct_id AND 
    phone1.phone_type_cd = 'B'

GO

