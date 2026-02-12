


CREATE VIEW dbo.prop_export_vw
AS
SELECT prop_supp_assoc.prop_id, 
    prop_supp_assoc.owner_tax_yr, property_profile.state_cd, 
    property_profile.land_type_cd, property_profile.yr_blt, 
    property_profile.living_area, property_profile.imprv_unit_price, 
    property_profile.land_sqft, property_profile.land_acres, 
    property_profile.land_front_feet, property_profile.land_depth, 
    property_profile.land_unit_price, property_profile.region, 
    property_profile.abs_subdv, property_profile.neighborhood, 
    property_profile.subset, property_profile.map_id, 
    property_val.legal_desc, property_val.legal_desc_2, 
    property_val.appraised_val, account.file_as_name, 
    address.addr_line1, address.addr_line2, address.addr_line3, 
    address.addr_city, address.addr_state, address.addr_zip, 
    address.primary_addr, property_val.land_hstd_val, 
    property_val.imprv_hstd_val, owner.owner_id, situs.primary_situs,
    situs.situs_num, situs.situs_street_prefx, situs.situs_street,
    situs.situs_street_sufix, situs.situs_unit, situs.situs_city,
    situs.situs_state, situs.situs_zip, situs.situs_display,
   property.geo_id, property.dba_name
FROM address RIGHT OUTER JOIN
    property_profile RIGHT OUTER JOIN
    account INNER JOIN
    owner ON 
    account.acct_id = owner.owner_id LEFT OUTER JOIN
    property_val INNER JOIN
    prop_supp_assoc ON 
    property_val.prop_id = prop_supp_assoc.prop_id AND 
    property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr AND
     property_val.sup_num = prop_supp_assoc.sup_num INNER JOIN
    property ON prop_supp_assoc.prop_id = property.prop_id ON 
    owner.prop_id = property_val.prop_id AND 
    owner.owner_tax_yr = property_val.prop_val_yr AND 
    owner.sup_num = property_val.sup_num LEFT OUTER JOIN
    situs ON property_val.prop_id = situs.prop_id AND 
    situs.primary_situs = 'Y' ON 
    property_profile.prop_id = prop_supp_assoc.prop_id AND 
    property_profile.prop_val_yr = prop_supp_assoc.owner_tax_yr ON
     address.acct_id = account.acct_id AND 
    address.primary_addr = 'Y'
WHERE property_val.prop_inactive_dt is null

GO

