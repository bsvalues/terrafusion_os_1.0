
CREATE VIEW dbo.arb_inquiry_search_vw
AS
SELECT     dbo.property.prop_id AS PropertyID, dbo.property.geo_id, dbo.property.simple_geo_id, dbo.property_val.prop_val_yr AS CaseYear, 
                      dbo.property_val.sup_num AS SupNumber, dbo.account.file_as_name AS Owner, dbo.property_val.legal_desc, dbo.property_val.abs_subdv_cd, 
                      dbo.property_val.hood_cd, dbo.appraiser.appraiser_nm AS Appraiser, dbo.property_profile.state_cd AS PTD, dbo.property.prop_type_cd, 
                      dbo.property_val.market, dbo._arb_inquiry.case_id AS CaseID, dbo._arb_inquiry.inq_create_dt, dbo._arb_inquiry.inq_complete_dt, 
                      dbo._arb_inquiry.inq_operator AS Operator, dbo._arb_inquiry.inq_type, dbo._arb_inquiry.inq_status, dbo._arb_inquiry.inq_nature, 
                      dbo._arb_inquiry.inq_appraisal_staff, dbo._arb_inquiry.inq_appraisal_staff_dt, dbo._arb_inquiry.inq_support_staff, 
                      dbo._arb_inquiry.inq_support_staff_dt, dbo._arb_inquiry.inq_gis_staff, dbo._arb_inquiry.inq_gis_staff_dt, dbo._arb_inquiry.inq_field_check, 
                      dbo._arb_inquiry.inq_field_staff, dbo._arb_inquiry.inq_field_staff_dt, dbo._arb_inquiry.inq_field_check_completed_dt, 
                      dbo._arb_inquiry.inq_taxpayer_doc_requested, dbo._arb_inquiry.inq_taxpayer_doc_request_dt, dbo._arb_inquiry.inq_taxpayer_doc_expected_dt, 
                      dbo._arb_inquiry.inq_taxpayer_doc_received_dt, dbo._arb_inquiry.inq_taxpayer_doc_type, dbo._arb_inquiry.inq_value_agreement_amt, 
                      dbo._arb_inquiry.inq_value_agreement_mail_dt, dbo._arb_inquiry.inq_value_agreement_fax_dt, dbo._arb_inquiry.inq_value_agreement_received_dt, 
                      dbo._arb_inquiry.inq_by_type, dbo._arb_inquiry.inq_by_id, dbo._arb_inquiry.inq_by_id_type, dbo._arb_inquiry.inq_assigned_val, 
                      dbo._arb_inquiry.inq_assigned_reason_cd, dbo._arb_inquiry.inq_taxpayer_comments, dbo._arb_inquiry.inq_appraiser_comments, 
                      dbo._arb_inquiry.begin_land_hstd_val, dbo._arb_inquiry.begin_land_non_hstd_val, dbo._arb_inquiry.begin_imprv_hstd_val, 
                      dbo._arb_inquiry.begin_imprv_non_hstd_val, dbo._arb_inquiry.begin_ag_use_val, dbo._arb_inquiry.begin_ag_market, 
                      dbo._arb_inquiry.begin_timber_use, dbo._arb_inquiry.begin_timber_market, dbo._arb_inquiry.begin_market, dbo._arb_inquiry.begin_appraised_val, 
                      dbo._arb_inquiry.begin_ten_percent_cap, dbo._arb_inquiry.begin_assessed_val, dbo._arb_inquiry.begin_rendered_val, 
                      dbo._arb_inquiry.begin_exemptions, dbo._arb_inquiry.begin_entities, dbo._arb_inquiry.final_land_hstd_val, 
                      dbo._arb_inquiry.final_land_non_hstd_val, dbo._arb_inquiry.final_imprv_hstd_val, dbo._arb_inquiry.final_imprv_non_hstd_val, 
                      dbo._arb_inquiry.final_ag_use_val, dbo._arb_inquiry.final_ag_market, dbo._arb_inquiry.final_timber_use, dbo._arb_inquiry.final_timber_market, 
                      dbo._arb_inquiry.final_market, dbo._arb_inquiry.final_appraised_val, dbo._arb_inquiry.final_ten_percent_cap, dbo._arb_inquiry.final_assessed_val, 
                      dbo._arb_inquiry.final_rendered_val, dbo._arb_inquiry.final_exemptions, dbo._arb_inquiry.final_entities, 
                      pacs_user_3.full_name AS operator_name, support_staff.name AS support_staff, support_staff.full_name AS support_staff_name, 
                      gis_staff.name AS gis_staff, gis_staff.full_name AS gis_staff_name, appraiser_1.appraiser_nm AS appraisal_staff_name, 
                      appraiser_2.appraiser_nm AS field_staff_name, dbo.owner.owner_id, dbo.account.ref_id1, account_1.file_as_name AS inquiry_by_name, 
                      dbo.property_val.last_appraiser_id,
			appraiser_3.appraiser_nm as meeting_appraiser_nm, dbo.property.prop_sic_cd,dbo.sic_code.sic_cd, dbo.sic_code.category_appraiser, a_4.appraiser_nm AS categ_appr_nm,
		      property_profile.imprv_type_cd as imprv_type_cd,
			property_val.property_use_cd as property_use_cd
	
FROM         dbo.account INNER JOIN dbo.owner 
				ON dbo.account.acct_id = dbo.owner.owner_id 
				INNER JOIN dbo.property_val 
				INNER JOIN dbo.prop_supp_assoc 
				ON dbo.property_val.prop_id = dbo.prop_supp_assoc.prop_id AND 
				dbo.property_val.prop_val_yr = dbo.prop_supp_assoc.owner_tax_yr AND 
				dbo.property_val.sup_num = dbo.prop_supp_assoc.sup_num 
				INNER JOIN dbo.property 
				ON dbo.prop_supp_assoc.prop_id = dbo.property.prop_id 
				LEFT OUTER JOIN dbo.property_profile 
				ON dbo.property_val.prop_id = dbo.property_profile.prop_id AND 
				dbo.property_val.prop_val_yr = dbo.property_profile.prop_val_yr AND 
				dbo.property_val.sup_num = dbo.property_profile.sup_num 
				ON dbo.owner.prop_id = dbo.property_val.prop_id AND 
				dbo.owner.owner_tax_yr = dbo.property_val.prop_val_yr AND 
				dbo.owner.sup_num = dbo.property_val.sup_num 
				INNER JOIN dbo._arb_inquiry 
				ON dbo.property_val.prop_id = dbo._arb_inquiry.prop_id AND 
				dbo.property_val.prop_val_yr = dbo._arb_inquiry.prop_val_yr 
				LEFT OUTER JOIN dbo.sic_code
				ON dbo.sic_code.sic_cd = dbo.property.prop_sic_cd
				LEFT OUTER JOIN
				dbo.appraiser 
ON dbo.property_val.last_appraiser_id = dbo.appraiser.appraiser_id LEFT OUTER JOIN
dbo.account account_1 ON dbo._arb_inquiry.inq_by_id = account_1.acct_id LEFT OUTER JOIN
dbo.appraiser appraiser_2 ON dbo._arb_inquiry.inq_field_staff = appraiser_2.appraiser_id LEFT OUTER JOIN
dbo.appraiser appraiser_1 ON dbo._arb_inquiry.inq_appraisal_staff = appraiser_1.appraiser_id LEFT OUTER JOIN
gis_staff ON dbo._arb_inquiry.inq_gis_staff = gis_staff.id LEFT OUTER JOIN
support_staff ON dbo._arb_inquiry.inq_support_staff = support_staff.id LEFT OUTER JOIN
dbo.pacs_user pacs_user_3 ON dbo._arb_inquiry.inq_operator = pacs_user_3.pacs_user_id
			left outer join appraiser as appraiser_3 on _arb_inquiry.appraiser_meeting_appraiser_id = appraiser_3.appraiser_id
LEFT OUTER JOIN dbo.appraiser as a_4 on a_4.appraiser_id = dbo.sic_code.category_appraiser

GO

