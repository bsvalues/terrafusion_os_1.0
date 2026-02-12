
create view arb_protest_search_vw
as

SELECT 
	property.prop_id AS PropertyID, property.geo_id, property.simple_geo_id, property_val.prop_val_yr AS CaseYear, 
	property_val.sup_num AS SupNumber, account.file_as_name AS Owner, property_val.legal_desc, property_val.abs_subdv_cd, 
	property_val.hood_cd, property_profile.state_cd AS PTD, property.prop_type_cd, property_val.market, 
	pacs_user_1.pacs_user_name AS operator_staff, pacs_user_1.full_name AS operator_staff_name, owner.owner_id, account.ref_id1, 
	account_1.file_as_name AS protest_by_name, pacs_user_2.pacs_user_name AS evidence_staff, pacs_user_2.full_name AS evidence_staff_name, 
	appraiser_1.appraiser_nm AS hearing_appraisal_staff_name, pacs_user_3.pacs_user_name AS taxes_verification_staff, 
	pacs_user_3.full_name AS taxes_verification_staff_name, pacs_user_4.pacs_user_name AS hearing_recorder_staff, 
	pacs_user_4.full_name AS hearing_recorder_staff_name, _arb_protest.case_id AS CaseID, _arb_protest.prot_create_dt, 
	_arb_protest.prot_complete_dt, _arb_protest.prot_type, _arb_protest.prot_status, _arb_protest.prot_taxpayer_doc_requested, 
	_arb_protest.prot_appr_docket_id, _arb_protest.prot_taxpayer_doc_recorded_dt, _arb_protest.prot_taxpayer_evidence_requested, 
	_arb_protest.prot_taxpayer_evidence_requested_dt, _arb_protest.prot_taxpayer_evidence_delivered_dt, 
	_arb_protest.prot_taxpayer_evidence_staff, _arb_protest.prot_taxpayer_additional_evidence, 
	_arb_protest.prot_taxpayer_evidence_waiver, _arb_protest.prot_taxes_paid, _arb_protest.prot_taxes_paid_verified_staff_id, 
	_arb_protest.prot_taxes_paid_verified_dt, _arb_protest.prot_appraisal_staff AS Operator, appba.prot_by_type, 
	appba.prot_by_id, appba.prot_by_id_type, _arb_protest.prot_comments, _arb_protest.prot_affidavit_testimony_dt, 
	_arb_protest.prot_affidavit_testimony_by, _arb_protest.prot_affidavit_testimony_received, _arb_protest.prot_assigned_panel, 
	_arb_protest.prot_arrived_dt, _arb_protest.prot_hearing_rescheduled, _arb_protest.prot_packet_printed_dt, 
	_arb_protest.prot_full_board_hearing, _arb_protest.prot_hearing_appraisal_staff, _arb_protest.prot_hearing_start_dt, 
	_arb_protest.prot_hearing_finished_dt, _arb_protest.prot_hearing_recorder_id, _arb_protest.prot_taxpayer_comments, 
	_arb_protest.prot_district_comments, _arb_protest.prot_first_motion, _arb_protest.prot_sustain_district_val, 
	_arb_protest.prot_first_motion_by, _arb_protest.prot_first_motion_seconded_by, _arb_protest.prot_first_motion_pass, 
	_arb_protest.prot_first_motion_decision_cd, _arb_protest.prot_first_motion_decision_dt, _arb_protest.prot_appraiser_assigned_val, 
	_arb_protest.prot_arb_assigned_val, _arb_protest.prot_arb_instructions, _arb_protest.prot_second_motion, 
	_arb_protest.prot_second_motion_by, _arb_protest.prot_second_motion_seconded_by, _arb_protest.prot_second_motion_pass, 
	_arb_protest.prot_second_motion_decision_cd, _arb_protest.prot_second_motion_decision_dt, _arb_protest.prot_other_motion, 
	_arb_protest.prot_full_ratification_dt, _arb_protest.begin_land_hstd_val, _arb_protest.begin_land_non_hstd_val, 
	_arb_protest.begin_imprv_hstd_val, _arb_protest.begin_imprv_non_hstd_val, _arb_protest.begin_ag_use_val, 
	_arb_protest.begin_ag_market, _arb_protest.begin_timber_use, _arb_protest.begin_timber_market, _arb_protest.begin_market, 
	_arb_protest.begin_appraised_val, _arb_protest.begin_ten_percent_cap, _arb_protest.begin_assessed_val, 
	_arb_protest.begin_rendered_val, _arb_protest.begin_exemptions, _arb_protest.begin_entities, _arb_protest.final_land_hstd_val, 
	_arb_protest.final_land_non_hstd_val, _arb_protest.final_imprv_hstd_val, _arb_protest.final_imprv_non_hstd_val, 
	_arb_protest.final_ag_use_val, _arb_protest.final_ag_market, _arb_protest.final_timber_use, _arb_protest.final_timber_market, 
	_arb_protest.final_market, _arb_protest.final_appraised_val, _arb_protest.final_ten_percent_cap, _arb_protest.final_assessed_val, 
	_arb_protest.final_rendered_val, _arb_protest.final_exemptions, _arb_protest.final_entities, appraiser.appraiser_nm AS Appraiser, 
	aphd.docket_start_date_time as hearing_scheduled_date,
	_arb_protest.docket_id, property_val.last_appraiser_id, _arb_protest.appraiser_meeting_appraiser_id, _arb_protest.case_prepared,
	appraiser_2.appraiser_nm as meeting_appraiser_nm, property.prop_sic_cd, sic_code.sic_cd, sic_code.category_appraiser, 
	ainq.inq_status,
	_arb_protest.appraiser_meeting_date_time AS meeting_scheduled_date, a_4.appraiser_nm AS categ_appr_nm,
--	aa.agent_id,
	agent_account.acct_id as agent_id,
	agent_account.file_as_name as agent_nm,
	property_profile.imprv_type_cd as imprv_type_cd,
	property_val.property_use_cd as property_use_cd,

	convert(int, arb_protest_prop_protest_count_vw.protest_count) as lProtestCount,
	ha.appraiser_full_name as hearing_appraisor_full_name,
	convert(int, arb_protest_protest_by_count_vw.protest_by_count)  as lProtestByCount,

	isnull(aphd.offsite, 0) as offsite

from _arb_protest with(nolock)
join arb_protest_prop_protest_count_vw with(nolock) on
	arb_protest_prop_protest_count_vw.prop_id = _arb_protest.prop_id and
	arb_protest_prop_protest_count_vw.prop_val_yr = _arb_protest.prop_val_yr
join prop_supp_assoc with(nolock) on
	prop_supp_assoc.prop_id = _arb_protest.prop_id AND 
	prop_supp_assoc.owner_tax_yr = _arb_protest.prop_val_yr
join property_val with(nolock) on
	property_val.prop_id = prop_supp_assoc.prop_id AND 
	property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr AND
	property_val.sup_num = prop_supp_assoc.sup_num
join owner with(nolock) on
	owner.prop_id = property_val.prop_id AND
	owner.owner_tax_yr = property_val.prop_val_yr AND 
	owner.sup_num = property_val.sup_num
join (
	select 
		prop_id, 
		sup_num, 
		owner_tax_yr,
		Case When CNT > 1 Then
				-- there are more than one owners but just getting the first owner_id will suffice for all other joins
			(select top 1 owner_id from owner where prop_id=ACCT_SRC.prop_id and owner_tax_yr=ACCT_SRC.owner_tax_yr and sup_num=ACCT_SRC.sup_num) 
		Else
				-- If there is only one owner, simply obtain that owner_id
			(select owner_id from owner where prop_id=ACCT_SRC.prop_id and owner_tax_yr=ACCT_SRC.owner_tax_yr and sup_num=ACCT_SRC.sup_num) 
		End acct_id,
		Case When CNT > 1 Then
				-- There is more than on owner, the owner name shall be designated
			'UDI Property'
		Else
				-- There is only one owner, simply obtain that file_as_name
			(
				select ao.file_as_name
				from property_val pv 
				inner join owner o on o.prop_id=pv.prop_id and o.sup_num=pv.sup_num and o.owner_tax_yr=pv.prop_val_yr
				inner join account ao on ao.acct_id=o.owner_id
				where pv.prop_id=ACCT_SRC.prop_id and o.owner_tax_yr=ACCT_SRC.owner_tax_yr and o.sup_num=ACCT_SRC.sup_num
			)
		End file_as_name,
		(
			select top 1 ao.ref_id1
			from property_val pv 
			inner join owner o on o.prop_id=pv.prop_id and o.sup_num=pv.sup_num and o.owner_tax_yr=pv.prop_val_yr
			inner join account ao on ao.acct_id=o.owner_id
			where pv.prop_id=ACCT_SRC.prop_id and o.owner_tax_yr=ACCT_SRC.owner_tax_yr and o.sup_num=ACCT_SRC.sup_num
		) ref_id1
	from (
		select count(prop_id) CNT, prop_id, sup_num, owner_tax_yr
		from owner with (nolock) 
		group by prop_id, sup_num, owner_tax_yr
	) ACCT_SRC
) account on
	account.acct_id = owner.owner_id and account.owner_tax_yr = owner.owner_tax_yr and account.prop_id = owner.prop_id and account.sup_num = owner.sup_num
join property with(nolock) on
	prop_supp_assoc.prop_id = property.prop_id
join arb_protest_protest_by_count_vw with(nolock) on
	arb_protest_protest_by_count_vw.case_id = _arb_protest.case_id and
	arb_protest_protest_by_count_vw.prop_val_yr = _arb_protest.prop_val_yr
join _arb_protest_protest_by_assoc as appba with(nolock) on
	appba.case_id = _arb_protest.case_id and
	appba.prop_val_yr = _arb_protest.prop_val_yr and
	appba.primary_protester = 1
left outer join property_profile with(nolock) on
	property_val.prop_id = property_profile.prop_id AND 
	property_val.prop_val_yr = property_profile.prop_val_yr
left outer join sic_code with(nolock) on
	sic_code.sic_cd = property.prop_sic_cd
left outer join appraiser with(nolock) on
	property_val.last_appraiser_id = appraiser.appraiser_id
left outer join pacs_user pacs_user_4 with(nolock) on
	_arb_protest.prot_hearing_recorder_id = pacs_user_4.pacs_user_id
left outer join pacs_user pacs_user_3 with(nolock) on
	_arb_protest.prot_taxes_paid_verified_staff_id = pacs_user_3.pacs_user_id
left outer join appraiser appraiser_1 with(nolock) on
	_arb_protest.prot_hearing_appraisal_staff = appraiser_1.appraiser_id
left outer join pacs_user pacs_user_2 with(nolock) on
	_arb_protest.prot_taxpayer_evidence_staff = pacs_user_2.pacs_user_id
left outer join pacs_user pacs_user_1 with(nolock) on
	_arb_protest.prot_appraisal_staff = pacs_user_1.pacs_user_id
left outer join account account_1 with(nolock) on
	appba.prot_by_id = account_1.acct_id
left outer join appraiser as appraiser_2 with(nolock) on
	_arb_protest.appraiser_meeting_appraiser_id = appraiser_2.appraiser_id
left outer join appraiser as a_4 with(nolock) on
	a_4.appraiser_id = sic_code.category_appraiser

left outer join _arb_protest_hearing_docket as aphd with(nolock) on
	aphd.docket_id = _arb_protest.docket_id
left outer join _arb_inquiry as ainq with(nolock) on
	ainq.prop_id = _arb_protest.prop_id and
	ainq.prop_val_yr = _arb_protest.prop_val_yr and
	_arb_protest.associated_inquiry = ainq.case_id
/*left outer join agent_assoc as aa with(nolock) on
	aa.prop_id = _arb_protest.prop_id and
	aa.owner_tax_yr = _arb_protest.prop_val_yr and 
	aa.owner_id = owner.owner_id */



left outer join account as agent_account with(nolock) on
--	agent_account.acct_id = aa.agent_id
	agent_account.acct_id = (select  top  1 aa1.agent_id
		from prop_supp_assoc psa with (nolock)
		inner join agent_assoc aa1 with (nolock) on
			aa1.prop_id = psa.prop_id 
		and 	aa1.owner_id = owner.owner_id
		and	aa1.owner_tax_yr = psa.owner_tax_yr 
		
		inner join agent a with (nolock) on
			a.agent_id = aa1.agent_id 
		and	a.inactive_flag = 0
		where 
		psa.prop_id in 
			(select prop_id 
			from 
				property_val pv with (nolock)
			where   (pv.prop_id = owner.prop_id or pv.udi_parent_prop_id = owner.prop_id)
			and 	pv.prop_val_yr = owner.owner_tax_yr
			and 	pv.sup_num = owner.sup_num
			and	(pv.prop_inactive_dt is null or pv.udi_parent = 'T'))
									
		and	psa.owner_tax_yr = owner.owner_tax_yr
		and 	psa.sup_num = owner.sup_num
		)
left outer join appraiser as ha with(nolock) on
	ha.appraiser_id = _arb_protest.prot_hearing_appraisal_staff

GO

