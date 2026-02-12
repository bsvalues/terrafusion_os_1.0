


CREATE   VIEW dbo.arb_protest_listing_vw
AS
SELECT     dbo._arb_protest.prop_id, dbo._arb_protest.prop_val_yr, dbo._arb_protest.case_id, dbo.prop_supp_assoc.sup_num, 
                      dbo.property_val.land_non_hstd_val, dbo.property_val.imprv_hstd_val, dbo.property_val.land_hstd_val, dbo.property_val.imprv_non_hstd_val, 
                      dbo.property_val.market, dbo.property_val.appraised_val, dbo.property_val.assessed_val, dbo.property_val.ag_use_val, dbo.property_val.ag_market, 
                      dbo.property_val.timber_use, dbo.property_val.timber_market, dbo.property_val.ten_percent_cap, dbo.property_val.legal_desc, dbo.property.geo_id, 
                      dbo.owner.owner_id, dbo.owner.pct_ownership, dbo.property.prop_type_cd, dbo._arb_protest.appraiser_meeting_date_time, 
                      dbo.account.file_as_name AS owner_name, dbo._arb_protest.prot_taxpayer_comments, dbo._arb_protest.prot_complete_dt, 
                      dbo._arb_protest.prot_status, dbo._arb_protest.prot_hearing_appraisal_staff, dbo._arb_protest.prot_type, 
                      dbo._arb_protest_hearing_docket.docket_start_date_time, dbo._arb_protest.prot_assigned_panel, property_val.last_appraiser_id, _arb_protest.appraiser_meeting_appraiser_id, appraiser.appraiser_nm as meeting_appraiser_nm,
		      dbo.property_val.property_use_cd as property_use_cd	
FROM         dbo._arb_protest INNER JOIN
                      dbo.prop_supp_assoc ON dbo.prop_supp_assoc.prop_id = dbo._arb_protest.prop_id AND 
                      dbo.prop_supp_assoc.owner_tax_yr = dbo._arb_protest.prop_val_yr INNER JOIN
                      dbo.owner ON dbo._arb_protest.prop_id = dbo.owner.prop_id AND dbo.prop_supp_assoc.owner_tax_yr = dbo.owner.owner_tax_yr AND 
                      dbo.prop_supp_assoc.sup_num = dbo.owner.sup_num INNER JOIN
                      dbo.property ON dbo._arb_protest.prop_id = dbo.property.prop_id INNER JOIN
                      dbo.property_val ON dbo.owner.prop_id = dbo.property_val.prop_id AND dbo.owner.owner_tax_yr = dbo.property_val.prop_val_yr AND 
                      dbo.owner.sup_num = dbo.property_val.sup_num LEFT OUTER JOIN
                      dbo.situs s ON dbo._arb_protest.prop_id = s.prop_id INNER JOIN
                      dbo.account ON dbo.owner.owner_id = dbo.account.acct_id LEFT OUTER JOIN
                      dbo._arb_protest_hearing_docket ON dbo._arb_protest.docket_id = dbo._arb_protest_hearing_docket.docket_id
			LEFT OUTER JOIN appraiser ON
				_arb_protest.appraiser_meeting_appraiser_id = appraiser.appraiser_id

GO

