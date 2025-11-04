
CREATE VIEW dbo.arb_listing_vw
AS
SELECT     dbo.arb_protest.appr_year, dbo.arb_protest.sup_num, dbo.arb_protest.prop_id, dbo.arb_protest.case_id, dbo.arb_protest.status, 
                      dbo.arb_protest.inquiry_appraiser_id, dbo.arb_protest.protest_appraiser_id, dbo.arb_protest.prop_val_yr, dbo.arb_protest.arb_hearing_date, 
                      dbo.arb_protest.arb_board, dbo.arb_protest.inquiry_taxpayer_comment, dbo.property_val.land_non_hstd_val, dbo.property_val.imprv_hstd_val, 
                      dbo.property_val.imprv_non_hstd_val, dbo.property_val.appraised_val, dbo.property_val.assessed_val, dbo.property_val.land_hstd_val, 
                      dbo.property_val.timber_use, dbo.property_val.ag_use_val, dbo.property_val.ag_market, dbo.property_val.timber_market, 
                      dbo.property_val.ten_percent_cap, dbo.property_val.legal_desc, dbo.property.geo_id, dbo.owner.owner_id, dbo.owner.pct_ownership, 
                      dbo.property.prop_type_cd, dbo.account.file_as_name, dbo.arb_protest.am_meeting_date, dbo.arb_protest.close_by_id, 
                      dbo.arb_protest.inquiry_type_cd
FROM         dbo.arb_protest INNER JOIN
                      dbo.property_val ON dbo.arb_protest.prop_id = dbo.property_val.prop_id AND dbo.arb_protest.prop_val_yr = dbo.property_val.prop_val_yr AND 
                      dbo.arb_protest.sup_num = dbo.property_val.sup_num INNER JOIN
                      dbo.owner ON dbo.arb_protest.prop_id = dbo.owner.prop_id AND dbo.arb_protest.sup_num = dbo.owner.sup_num AND 
                      dbo.arb_protest.prop_val_yr = dbo.owner.owner_tax_yr INNER JOIN
                      dbo.property ON dbo.property_val.prop_id = dbo.property.prop_id INNER JOIN
                      dbo.account ON dbo.owner.owner_id = dbo.account.acct_id

GO

