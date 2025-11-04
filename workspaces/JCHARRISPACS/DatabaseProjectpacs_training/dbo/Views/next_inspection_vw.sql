





CREATE  VIEW dbo.next_inspection_vw
AS
SELECT owner.prop_id, property_val.prop_val_yr, owner.owner_id, 
    owner.pct_ownership, account.file_as_name, 
    property_val.legal_desc, situs.primary_situs, situs.situs_num,
    situs.situs_street_prefx, situs.situs_street, situs.situs_street_sufix,
    situs.situs_unit, situs.situs_city, situs.situs_state,
    situs.situs_zip, situs.situs_display,
    property_val.hood_cd, property.dba_name, 
    property_val.last_appraisal_yr, property_val.last_appraisal_dt, 
    property_val.last_appraiser_id, property_val.next_appraisal_dt, 
    property_val.next_appraiser_id, property_val.next_appraisal_rsn, 
    property.geo_id, property_val.map_id
FROM account INNER JOIN
    owner ON account.acct_id = owner.owner_id INNER JOIN
    property ON owner.prop_id = property.prop_id INNER JOIN
    property_val ON owner.prop_id = property_val.prop_id AND 
    owner.owner_tax_yr = property_val.prop_val_yr AND 
    owner.sup_num = property_val.sup_num LEFT OUTER JOIN
    situs ON property.prop_id = situs.prop_id AND 
    situs.primary_situs = 'Y'

GO

