





CREATE     VIEW dbo.transfer_current_appraisal_info_vw
AS
SELECT     dbo.property.prop_id, dbo.property.prop_type_cd, dbo.property_val.abs_subdv_cd, dbo.property_val.hood_cd, dbo.property_val.block, 
                      dbo.property_val.tract_or_lot, dbo.property.geo_id, dbo.owner.owner_id, dbo.owner.pct_ownership, dbo.account.file_as_name, 
                      dbo.address.primary_addr, dbo.address.addr_line1, dbo.address.addr_line2, dbo.address.addr_line3, dbo.address.addr_city, dbo.address.addr_state, 
                      dbo.address.country_cd, dbo.address.addr_zip, dbo.address.ml_deliverable, dbo.property_val.land_hstd_val, dbo.property_val.land_non_hstd_val, 
                      dbo.property_val.imprv_hstd_val, dbo.property_val.imprv_non_hstd_val, dbo.property_val.appraised_val, dbo.property_val.assessed_val, 
                      dbo.property_val.market, dbo.property_val.ag_use_val, dbo.property_val.ag_market, dbo.property_val.timber_market, dbo.property_val.timber_use, 
                      dbo.property_val.ten_percent_cap, dbo.property_val.legal_desc, dbo.property_val.legal_desc_2, dbo.property_val.legal_acreage, 
                      dbo.property_val.sup_cd, dbo.property_val.sup_desc, dbo.property_val.sup_dt, dbo.property_val.sup_action, dbo.property_val.prop_val_yr, 
                      dbo.transfer_appraisal_info_supp_assoc.prop_id AS Expr1, dbo.transfer_appraisal_info_supp_assoc.sup_num, dbo.property_val.vit_flag, 
                      dbo.address.delivery_point, dbo.address.carrier_route, dbo.address.check_digit, dbo.property.dba_name, dbo.account.confidential_flag, 
                      dbo.account.confidential_file_as_name, property_val.ag_late_loss
FROM         dbo.transfer_appraisal_info_supp_assoc INNER JOIN
                      dbo.property ON dbo.transfer_appraisal_info_supp_assoc.prop_id = dbo.property.prop_id INNER JOIN
                      dbo.owner INNER JOIN
                      dbo.property_val ON dbo.owner.prop_id = dbo.property_val.prop_id AND dbo.owner.owner_tax_yr = dbo.property_val.prop_val_yr AND 
                      dbo.owner.sup_num = dbo.property_val.sup_num INNER JOIN
                      dbo.account ON dbo.owner.owner_id = dbo.account.acct_id ON dbo.transfer_appraisal_info_supp_assoc.prop_id = dbo.property_val.prop_id AND 
                      dbo.transfer_appraisal_info_supp_assoc.owner_tax_yr = dbo.property_val.prop_val_yr AND 
                      dbo.transfer_appraisal_info_supp_assoc.sup_num = dbo.property_val.sup_num LEFT OUTER JOIN
                      dbo.address ON dbo.account.acct_id = dbo.address.acct_id AND dbo.address.primary_addr = 'Y'
WHERE     (dbo.property_val.prop_inactive_dt IS NULL)

GO

