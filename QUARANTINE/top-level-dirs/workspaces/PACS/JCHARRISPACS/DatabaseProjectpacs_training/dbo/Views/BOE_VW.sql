create view BOE_VW
as

SELECT        


property.prop_id AS ParcelID, property.geo_id, property.simple_geo_id, property_val.prop_val_yr AS CaseYear, property_val.sup_num AS SupNumber, account.file_as_name AS Owner, 
                         property_val.legal_desc, property_val.abs_subdv_cd, property_val.hood_cd, property_profile.state_cd AS PTD, property.prop_type_cd, property_val.market, pacs_user_1.pacs_user_name AS operator_staff, 
                         pacs_user_1.full_name AS operator_staff_name, owner.owner_id, account.ref_id1, account_1.file_as_name AS protest_by_name, pacs_user_2.pacs_user_name AS evidence_staff, 
                         pacs_user_2.full_name AS evidence_staff_name, appraiser_1.appraiser_nm AS hearing_appraisal_staff_name, pacs_user_3.pacs_user_name AS taxes_verification_staff, 
                         pacs_user_3.full_name AS taxes_verification_staff_name, _arb_protest.prot_taxpayer_evidence_requested, _arb_protest.prot_taxpayer_evidence_requested_dt, 
                         _arb_protest.prot_taxpayer_evidence_delivered_dt, _arb_protest.prot_taxpayer_evidence_staff, _arb_protest.prot_taxpayer_additional_evidence, _arb_protest.prot_full_ratification_dt, 
                         _arb_protest.begin_land_hstd_val, _arb_protest.begin_land_non_hstd_val, _arb_protest.begin_imprv_hstd_val, _arb_protest.begin_imprv_non_hstd_val, _arb_protest.begin_ag_use_val, 
                         _arb_protest.begin_ag_market, _arb_protest.begin_timber_use, _arb_protest.begin_timber_market, _arb_protest.begin_market, _arb_protest.begin_appraised_val, _arb_protest.begin_ten_percent_cap, 
                         _arb_protest.begin_assessed_val, _arb_protest.begin_rendered_val, _arb_protest.begin_exemptions, _arb_protest.begin_entities, _arb_protest.final_land_hstd_val, _arb_protest.final_land_non_hstd_val, 
                         _arb_protest.final_imprv_hstd_val, _arb_protest.final_imprv_non_hstd_val, _arb_protest.final_ag_use_val, _arb_protest.final_ag_market, _arb_protest.final_timber_use, _arb_protest.final_timber_market, 
                         _arb_protest.final_market, _arb_protest.final_appraised_val, _arb_protest.final_ten_percent_cap, _arb_protest.final_assessed_val, _arb_protest.final_rendered_val, _arb_protest.final_exemptions, 
                         _arb_protest.final_entities, appraiser.appraiser_nm AS Appraiser, aphd.docket_start_date_time AS hearing_scheduled_date, _arb_protest.docket_id, property_val.last_appraiser_id, 
                         _arb_protest.appraiser_meeting_appraiser_id, _arb_protest.case_prepared, appraiser_2.appraiser_nm AS meeting_appraiser_nm, property.prop_sic_cd, sic_code.sic_cd, sic_code.category_appraiser, 
                         ainq.inq_status, _arb_protest.appraiser_meeting_date_time AS meeting_scheduled_date, a_4.appraiser_nm AS categ_appr_nm, agent_account.acct_id AS agent_id, agent_account.file_as_name AS agent_nm, 
                         property_profile.imprv_type_cd, property_val.property_use_cd, CONVERT(int, arb_protest_prop_protest_count_vw.protest_count) AS lProtestCount, ha.appraiser_full_name AS hearing_appraisor_full_name, 
                         CONVERT(int, arb_protest_protest_by_count_vw.protest_by_count) AS lProtestByCount, ISNULL(aphd.offsite, 0) AS offsite, _arb_event_object.szObjectPath as img_path , _arb_event_object.dtObject,
						Xcoord, YCoord
FROM            appraiser AS ha WITH (nolock) RIGHT OUTER JOIN
                         _arb_protest WITH (nolock) INNER JOIN
                         arb_protest_prop_protest_count_vw WITH (nolock) ON arb_protest_prop_protest_count_vw.prop_id = _arb_protest.prop_id AND 
                         arb_protest_prop_protest_count_vw.prop_val_yr = _arb_protest.prop_val_yr INNER JOIN
                         prop_supp_assoc WITH (nolock) ON prop_supp_assoc.prop_id = _arb_protest.prop_id AND prop_supp_assoc.owner_tax_yr = _arb_protest.prop_val_yr INNER JOIN
                         property_val WITH (nolock) ON property_val.prop_id = prop_supp_assoc.prop_id AND property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr AND 
                         property_val.sup_num = prop_supp_assoc.sup_num INNER JOIN
                         owner WITH (nolock) ON owner.prop_id = property_val.prop_id AND owner.owner_tax_yr = property_val.prop_val_yr AND owner.sup_num = property_val.sup_num INNER JOIN
                             (SELECT        prop_id, sup_num, owner_tax_yr, CASE WHEN CNT > 1 THEN
                                                             (SELECT        TOP 1 owner_id
                                                               FROM            owner
                                                               WHERE        prop_id = ACCT_SRC.prop_id AND owner_tax_yr = ACCT_SRC.owner_tax_yr AND sup_num = ACCT_SRC.sup_num) ELSE
                                                             (SELECT        owner_id
                                                               FROM            owner
                                                               WHERE        prop_id = ACCT_SRC.prop_id AND owner_tax_yr = ACCT_SRC.owner_tax_yr AND sup_num = ACCT_SRC.sup_num) END AS acct_id, 
                                                         CASE WHEN CNT > 1 THEN 'UDI Property' ELSE
                                                             (SELECT        ao.file_as_name
                                                               FROM            property_val pv INNER JOIN
                                                                                         owner o ON o.prop_id = pv.prop_id AND o.sup_num = pv.sup_num AND o.owner_tax_yr = pv.prop_val_yr INNER JOIN
                                                                                         account ao ON ao.acct_id = o.owner_id
                                                               WHERE        pv.prop_id = ACCT_SRC.prop_id AND o.owner_tax_yr = ACCT_SRC.owner_tax_yr AND o.sup_num = ACCT_SRC.sup_num) END AS file_as_name,
                                                             (SELECT        TOP (1) ao.ref_id1
                                                               FROM            property_val AS pv INNER JOIN
                                                                                         owner AS o ON o.prop_id = pv.prop_id AND o.sup_num = pv.sup_num AND o.owner_tax_yr = pv.prop_val_yr INNER JOIN
                                                                                         account AS ao ON ao.acct_id = o.owner_id
                                                               WHERE        (pv.prop_id = ACCT_SRC.prop_id) AND (o.owner_tax_yr = ACCT_SRC.owner_tax_yr) AND (o.sup_num = ACCT_SRC.sup_num)) AS ref_id1
                               FROM            (SELECT        COUNT(prop_id) AS CNT, prop_id, sup_num, owner_tax_yr
                                                         FROM            owner AS owner_1 WITH (nolock)
                                                         GROUP BY prop_id, sup_num, owner_tax_yr) AS ACCT_SRC) AS account ON account.acct_id = owner.owner_id AND account.owner_tax_yr = owner.owner_tax_yr AND 
                         account.prop_id = owner.prop_id AND account.sup_num = owner.sup_num INNER JOIN
                         property WITH (nolock) ON prop_supp_assoc.prop_id = property.prop_id INNER JOIN
                         arb_protest_protest_by_count_vw WITH (nolock) ON arb_protest_protest_by_count_vw.case_id = _arb_protest.case_id AND arb_protest_protest_by_count_vw.prop_val_yr = _arb_protest.prop_val_yr INNER JOIN
                         _arb_protest_protest_by_assoc AS appba WITH (nolock) ON appba.case_id = _arb_protest.case_id AND appba.prop_val_yr = _arb_protest.prop_val_yr AND appba.primary_protester = 1 INNER JOIN
                         _arb_event INNER JOIN
                         _arb_event_object ON _arb_event.lEventID = _arb_event_object.lEventID ON prop_supp_assoc.prop_id = _arb_event.lPropID LEFT OUTER JOIN
                         property_profile WITH (nolock) ON property_val.prop_id = property_profile.prop_id AND property_val.prop_val_yr = property_profile.prop_val_yr LEFT OUTER JOIN
                         sic_code WITH (nolock) ON sic_code.sic_cd = property.prop_sic_cd LEFT OUTER JOIN
                         appraiser WITH (nolock) ON property_val.last_appraiser_id = appraiser.appraiser_id LEFT OUTER JOIN
                         pacs_user AS pacs_user_4 WITH (nolock) ON _arb_protest.prot_hearing_recorder_id = pacs_user_4.pacs_user_id LEFT OUTER JOIN
                         pacs_user AS pacs_user_3 WITH (nolock) ON _arb_protest.prot_taxes_paid_verified_staff_id = pacs_user_3.pacs_user_id LEFT OUTER JOIN
                         appraiser AS appraiser_1 WITH (nolock) ON _arb_protest.prot_hearing_appraisal_staff = appraiser_1.appraiser_id LEFT OUTER JOIN
                         pacs_user AS pacs_user_2 WITH (nolock) ON _arb_protest.prot_taxpayer_evidence_staff = pacs_user_2.pacs_user_id LEFT OUTER JOIN
                         pacs_user AS pacs_user_1 WITH (nolock) ON _arb_protest.prot_appraisal_staff = pacs_user_1.pacs_user_id LEFT OUTER JOIN
                         account AS account_1 WITH (nolock) ON appba.prot_by_id = account_1.acct_id LEFT OUTER JOIN
                         appraiser AS appraiser_2 WITH (nolock) ON _arb_protest.appraiser_meeting_appraiser_id = appraiser_2.appraiser_id LEFT OUTER JOIN
                         appraiser AS a_4 WITH (nolock) ON a_4.appraiser_id = sic_code.category_appraiser LEFT OUTER JOIN
                         _arb_protest_hearing_docket AS aphd WITH (nolock) ON aphd.docket_id = _arb_protest.docket_id LEFT OUTER JOIN
                         _arb_inquiry AS ainq WITH (nolock) ON ainq.prop_id = _arb_protest.prop_id AND ainq.prop_val_yr = _arb_protest.prop_val_yr AND _arb_protest.associated_inquiry = ainq.case_id LEFT OUTER JOIN
                         account AS agent_account WITH (nolock) ON agent_account.acct_id =
                             (SELECT        TOP (1) aa1.agent_id
                               FROM            prop_supp_assoc AS psa WITH (nolock) INNER JOIN
                                                         agent_assoc AS aa1 WITH (nolock) ON aa1.prop_id = psa.prop_id AND aa1.owner_id = owner.owner_id AND aa1.owner_tax_yr = psa.owner_tax_yr INNER JOIN
                                                         agent AS a WITH (nolock) ON a.agent_id = aa1.agent_id AND a.inactive_flag = 0
                               WHERE        (psa.prop_id IN
                                                            
															
						 (SELECT        prop_id
                                  FROM            property_val AS pv WITH (nolock)
                                   WHERE        (prop_id = owner.prop_id) AND (prop_val_yr = owner.owner_tax_yr) AND (sup_num = owner.sup_num) AND (prop_inactive_dt IS NULL) OR
                                 (prop_val_yr = owner.owner_tax_yr) AND (sup_num = owner.sup_num) AND (prop_inactive_dt IS NULL) AND (udi_parent_prop_id = owner.prop_id) OR
                                (prop_id = owner.prop_id) AND (prop_val_yr = owner.owner_tax_yr) AND (sup_num = owner.sup_num) AND (udi_parent = 'T') OR
                         (prop_val_yr = owner.owner_tax_yr) AND (sup_num = owner.sup_num) AND (udi_parent_prop_id = owner.prop_id) AND (udi_parent = 'T'))) AND 
                                                         (psa.owner_tax_yr = owner.owner_tax_yr) AND (psa.sup_num = owner.sup_num)) ON ha.appraiser_id = _arb_protest.prot_hearing_appraisal_staff

														
														 left join
  (SELECT 
[Parcel_ID],
ROW_NUMBER() 
over 
(partition by prop_id 
ORDER BY [OBJECTID] DESC) 
AS order_id,
[Prop_ID],
 [CENTROID_X]as XCoord,
      [CENTROID_Y]  as YCoord 


FROM 
[Benton_spatial_data].[dbo].[PARCEL_SP]
) as coords
 
ON 

property.prop_id = coords.Prop_ID AND coords.order_id = 1

WHERE 
XCoord IS NOT NULL 
--and
--prop_val_yr = --2018 (select appr_yr  from pacs_oltp.dbo.pacs_system)  

GO

