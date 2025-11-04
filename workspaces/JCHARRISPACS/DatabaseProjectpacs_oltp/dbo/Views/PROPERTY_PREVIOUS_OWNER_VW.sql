

CREATE VIEW dbo.PROPERTY_PREVIOUS_OWNER_VW
AS
SELECT     dbo.property.prop_id, dbo.property_type.prop_type_desc, dbo.account.first_name, dbo.account.last_name, dbo.account.file_as_name, 
                      account1.file_as_name AS taxpayer, dbo.property_val.legal_desc,
                      dbo.situs.primary_situs, dbo.situs.situs_num, dbo.situs.situs_street_prefx, dbo.situs.situs_street,
                      dbo.situs.situs_street_sufix, dbo.situs.situs_unit, dbo.situs.situs_city, dbo.situs.situs_state,
                      dbo.situs.situs_zip, dbo.situs.situs_display, dbo.owner.hs_prop, dbo.account.acct_id, 
                      dbo.account.ref_id1, dbo.owner.owner_tax_yr, dbo.property.geo_id, dbo.property_val.sup_num, dbo.account.confidential_file_as_name, 
                      dbo.account.confidential_first_name, dbo.account.confidential_last_name, dbo.property_val.appraised_val, dbo.property_val.legal_acreage, 
                      dbo.property_val.eff_size_acres, dbo.property.prop_sic_cd, dbo.imprv.mbl_hm_sn, dbo.imprv.mbl_hm_title_num
FROM         dbo.property INNER JOIN
                      dbo.chg_of_owner_prop_assoc ON dbo.property.prop_id = dbo.chg_of_owner_prop_assoc.prop_id INNER JOIN
                      dbo.seller_assoc ON dbo.chg_of_owner_prop_assoc.chg_of_owner_id = dbo.seller_assoc.chg_of_owner_id INNER JOIN
                      dbo.account ON dbo.seller_assoc.seller_id = dbo.account.acct_id INNER JOIN
                      dbo.property_type ON dbo.property.prop_type_cd = dbo.property_type.prop_type_cd INNER JOIN
                      dbo.owner ON dbo.property.prop_id = dbo.owner.prop_id INNER JOIN
                      dbo.account account1 ON dbo.owner.owner_id = account1.acct_id INNER JOIN
                      dbo.prop_supp_assoc ON dbo.property.prop_id = dbo.prop_supp_assoc.prop_id INNER JOIN
                      dbo.property_val ON dbo.prop_supp_assoc.prop_id = dbo.property_val.prop_id AND 
                      dbo.prop_supp_assoc.owner_tax_yr = dbo.property_val.prop_val_yr AND dbo.prop_supp_assoc.sup_num = dbo.property_val.sup_num AND 
                      dbo.owner.owner_tax_yr = dbo.property_val.prop_val_yr LEFT OUTER JOIN
                      dbo.situs ON dbo.property.prop_id = dbo.situs.prop_id LEFT OUTER JOIN
                      dbo.imprv ON dbo.property_val.prop_id = dbo.imprv.prop_id AND 
                      dbo.property_val.prop_val_yr = dbo.imprv.prop_val_yr AND dbo.property_val.sup_num = dbo.imprv.sup_num

GO

