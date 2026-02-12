




CREATE VIEW dbo.appr_notice_selection_criteria_vw
AS
SELECT
	pacs_user.pacs_user_name AS created_by_name, 
	pacs_user1.pacs_user_name AS printed_by_name, 
	appr_notice_selection_criteria.notice_yr, 
	appr_notice_selection_criteria.notice_num, 
	appr_notice_selection_criteria.create_dt, 
	appr_notice_selection_criteria.created_by, 
	appr_notice_selection_criteria.print_dt, 
	appr_notice_selection_criteria.printed_by, 
	appr_notice_selection_criteria.use_19a, 
	appr_notice_selection_criteria.use_19i, 
	appr_notice_selection_criteria.use_mkt_19a, 
	appr_notice_selection_criteria.use_assd_19a, 
	appr_notice_selection_criteria.use_value_inc_greater_than_19a,
	appr_notice_selection_criteria.value_inc_greater_than_19a, 
	appr_notice_selection_criteria.value_decr_less_than_19a, 
	appr_notice_selection_criteria.use_value_decr_less_than_19a, 
	appr_notice_selection_criteria.use_include_code_19a, 
	appr_notice_selection_criteria.use_exclude_code_X19a, 
	appr_notice_selection_criteria.use_include_props_w_rend_19a,
	appr_notice_selection_criteria.use_new_prop_19a, 
	appr_notice_selection_criteria.use_last_appr_year_19i, 
	appr_notice_selection_criteria.last_appr_year_19i, 
	appr_notice_selection_criteria.use_last_owner_change_19i, 
	appr_notice_selection_criteria.last_owner_change_date_19i, 
	appr_notice_selection_criteria.use_include_code_19i, 
	appr_notice_selection_criteria.use_exclude_code_X19i, 
	appr_notice_selection_criteria.rend_19a_option, 
	appr_notice_real_count.real_count, 
	appr_notice_personal_count.personal_count, 
	appr_notice_mobile_count.mobile_count, 
	appr_notice_auto_count.auto_count, 
	appr_notice_mineral_count.mineral_count, 
	appr_notice_selection_criteria.auto_option, 
	appr_notice_selection_criteria.mobile_option, 
	appr_notice_selection_criteria.mineral_option, 
	appr_notice_selection_criteria.personal_option, 
	appr_notice_selection_criteria.real_option, 
	appr_notice_selection_criteria.shared_prop_option, 
	appr_notice_selection_criteria.use_include_code_19ac, 
	appr_notice_selection_criteria.use_include_code_19ic, 
	appr_notice_selection_criteria.sup_num, 
	appr_notice_selection_criteria.sup_yr,
	sup_group.status_cd,
	appr_notice_selection_criteria.use_special_group_selection
FROM
	appr_notice_selection_criteria
INNER JOIN
	pacs_user
ON
	appr_notice_selection_criteria.created_by = pacs_user.pacs_user_id
LEFT OUTER JOIN
	supplement
ON
	appr_notice_selection_criteria.sup_yr = supplement.sup_tax_yr
AND	appr_notice_selection_criteria.sup_num = supplement.sup_num
LEFT OUTER JOIN
	sup_group
ON
	supplement.sup_group_id = sup_group.sup_group_id
LEFT OUTER JOIN
	supp_status
ON
	sup_group.status_cd = supp_status.status_cd
LEFT OUTER JOIN
	appr_notice_real_count
ON
	appr_notice_selection_criteria.notice_yr = appr_notice_real_count.notice_yr
AND	appr_notice_selection_criteria.notice_num = appr_notice_real_count.notice_num
LEFT OUTER JOIN
	appr_notice_personal_count
ON
	appr_notice_selection_criteria.notice_yr = appr_notice_personal_count.notice_yr
AND	appr_notice_selection_criteria.notice_num = appr_notice_personal_count.notice_num
LEFT OUTER JOIN
	appr_notice_mobile_count
ON
	appr_notice_selection_criteria.notice_yr = appr_notice_mobile_count.notice_yr
AND	appr_notice_selection_criteria.notice_num = appr_notice_mobile_count.notice_num
LEFT OUTER JOIN
	appr_notice_auto_count
ON
	appr_notice_selection_criteria.notice_yr = appr_notice_auto_count.notice_yr
AND	appr_notice_selection_criteria.notice_num = appr_notice_auto_count.notice_num
LEFT OUTER JOIN
	appr_notice_mineral_count
ON
	appr_notice_selection_criteria.notice_yr = appr_notice_mineral_count.notice_yr
AND	appr_notice_selection_criteria.notice_num = appr_notice_mineral_count.notice_num
LEFT OUTER JOIN
	pacs_user pacs_user1
ON
	appr_notice_selection_criteria.printed_by = pacs_user1.pacs_user_id

GO

