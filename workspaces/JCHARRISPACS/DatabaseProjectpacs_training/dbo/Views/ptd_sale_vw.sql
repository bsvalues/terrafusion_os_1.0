CREATE VIEW dbo.ptd_sale_vw
AS
SELECT TOP 0 property_val.land_hstd_val, 
    property_val.land_non_hstd_val, property_val.imprv_hstd_val, 
    property_val.imprv_non_hstd_val, property_val.ag_use_val, 
    property_val.timber_use, property_val.legal_desc, 
    entity.entity_id, entity.entity_cd, property_val.prop_id, 
    property_val.prop_val_yr, curr_chg_of_owner_vw.deed_num, 
    curr_chg_of_owner_vw.deed_type_cd, 
    curr_chg_of_owner_vw.deed_book_id, 
    curr_chg_of_owner_vw.deed_book_page, 
    curr_chg_of_owner_vw.deed_dt, sale.sl_dt, sale.sl_price, 
    property_val.assessed_val, property_val.appraised_val, 
    situs.primary_situs, situs.situs_num, situs.situs_street_prefx,
    situs.situs_street, situs.situs_street_sufix, situs.situs_unit,
    situs.situs_city, situs.situs_state, situs.situs_zip, situs.situs_display,
    ptd_imprv_area_vw.imprv_sqft, 
    ptd_imprv_state_cd_vw.imprv_state_cd, 
    property.prop_type_cd, property_val.sup_num, 
    ptd_land_state_cd_vw.state_cd AS land_state_cd
FROM property_val INNER JOIN
    prop_supp_assoc ON 
    property_val.prop_id = prop_supp_assoc.prop_id AND 
    property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr AND
     property_val.sup_num = prop_supp_assoc.sup_num INNER JOIN
    entity_prop_assoc ON 
    prop_supp_assoc.prop_id = entity_prop_assoc.prop_id AND 
    prop_supp_assoc.owner_tax_yr = entity_prop_assoc.tax_yr AND
     prop_supp_assoc.sup_num = entity_prop_assoc.sup_num INNER
     JOIN
    entity ON 
    entity_prop_assoc.entity_id = entity.entity_id INNER JOIN
    property ON 
    entity_prop_assoc.prop_id = property.prop_id LEFT OUTER JOIN
    ptd_land_state_cd_vw ON 
    property_val.prop_id = ptd_land_state_cd_vw.prop_id AND 
    property_val.prop_val_yr = ptd_land_state_cd_vw.prop_val_yr AND
     property_val.sup_num = ptd_land_state_cd_vw.sup_num LEFT OUTER
     JOIN
    situs ON entity_prop_assoc.prop_id = situs.prop_id AND 
    situs.primary_situs = 'Y' LEFT OUTER JOIN
    ptd_imprv_state_cd_vw ON 
    property_val.prop_id = ptd_imprv_state_cd_vw.prop_id AND 
    property_val.sup_num = ptd_imprv_state_cd_vw.sup_num AND 
    property_val.prop_val_yr = ptd_imprv_state_cd_vw.prop_val_yr
     LEFT OUTER JOIN
    ptd_imprv_area_vw ON 
    property_val.prop_id = ptd_imprv_area_vw.prop_id AND 
    property_val.prop_val_yr = ptd_imprv_area_vw.prop_val_yr AND
     property_val.sup_num = ptd_imprv_area_vw.sup_num LEFT OUTER
     JOIN
    sale RIGHT OUTER JOIN
    curr_chg_of_owner_vw ON 
    sale.chg_of_owner_id = curr_chg_of_owner_vw.chg_of_owner_id
     ON 
    property_val.prop_id = curr_chg_of_owner_vw.prop_id AND 
    property_val.sup_num = curr_chg_of_owner_vw.sup_num AND 
    property_val.prop_val_yr = curr_chg_of_owner_vw.sup_tax_yr

GO

