


CREATE VIEW dbo.web_general_vw
AS
SELECT prop_supp_assoc.prop_id, 
    prop_supp_assoc.owner_tax_yr, prop_supp_assoc.sup_num, 
    property_val.legal_desc, property_val.legal_desc_2, 
    property.prop_type_cd, property_type.prop_type_desc, 
    property.geo_id, property_val.hood_cd, neighborhood.hood_name, 
    situs.primary_situs, situs.situs_num, situs.situs_street_prefx,
    situs.situs_street, situs.situs_street_sufix, situs.situs_unit,
    situs.situs_city, situs.situs_state, situs.situs_zip, situs.situs_display,
    property_val.image_path, 
    account.file_as_name,
    property_val.mbl_hm_park, property_val.abs_subdv_cd,
    property_val.map_id,
    isnull(land_hstd_val, 0) as land_hstd_val,
    isnull(land_non_hstd_val, 0) as land_non_hstd_val,
    isnull(imprv_hstd_val, 0) as imprv_hstd_val,
    isnull(imprv_non_hstd_val, 0) as imprv_non_hstd_val,
    isnull(appraised_val, 0) as appraised_val,
    isnull(assessed_val, 0) as assessed_val,
    isnull(market, 0) as market,
    isnull(ag_use_val, 0) as ag_use_val,
    isnull(ag_market, 0) as ag_market,
    isnull(timber_use, 0) as timber_use,
    isnull(timber_market, 0) as timber_market,
    isnull(ten_percent_cap, 0) as ten_percent_cap,
    prop_inactive_dt,
    (isnull(imprv_hstd_val, 0) + isnull(imprv_non_hstd_val, 0)) as imprv,
    (isnull(land_hstd_val, 0) + isnull(land_non_hstd_val, 0) + isnull(ag_market, 0) + isnull(timber_market, 0)) as land_market,
    (isnull(ag_use_val, 0) + isnull(timber_use, 0)) as ag_valuation,
    isnull(ten_percent_cap, 0) as hs_cap,
    case when prop_inactive_dt is null then 'T' else 'F' end as active_acct
FROM account INNER JOIN
    owner ON 
    account.acct_id = owner.owner_id
    AND isnull(account.web_suppression, 'N') <> 'Y' LEFT OUTER JOIN
    prop_supp_assoc INNER JOIN
    property_val ON 
    prop_supp_assoc.prop_id = property_val.prop_id AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num INNER JOIN
    property ON property_val.prop_id = property.prop_id AND 
    property_val.prop_inactive_dt IS NULL INNER JOIN
    property_type ON 
    property.prop_type_cd = property_type.prop_type_cd ON 
    owner.prop_id = prop_supp_assoc.prop_id AND 
    owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr AND 
    owner.sup_num = prop_supp_assoc.sup_num LEFT OUTER JOIN
    situs ON property.prop_id = situs.prop_id AND 
    situs.primary_situs = 'Y' LEFT OUTER JOIN
    neighborhood ON 
    property_val.hood_cd = neighborhood.hood_cd AND 
    property_val.prop_val_yr = neighborhood.hood_yr

GO

