


CREATE procedure UpdateApprNoticePropList2519A

@input_notice_yr	numeric(4),
@input_notice_num	int

as

if exists
(
	select
		*
	from
		appr_notice_selection_criteria with (nolock)
	where
		notice_yr = @input_notice_yr
	and	notice_num = @input_notice_num
)
begin 
	/* log the current appraisal notice configuration maintenance infor on the selection criteria record */
	update
		appr_notice_selection_criteria
	set
		notice_line1 = appr_notice_config_maint.notice_line1,
		notice_line2 = appr_notice_config_maint.notice_line2,
		notice_line3 = appr_notice_config_maint.notice_line3, 
		arb_hearing_dt = appr_notice_config_maint.arb_hearing_dt,
		arb_protest_due_dt = appr_notice_config_maint.arb_protest_due_dt,
		arb_location = appr_notice_config_maint.arb_location,
		print_prop_id_19a = appr_notice_config_maint.print_prop_id_19a,
		print_prior_year_19a = appr_notice_config_maint.print_prior_year_19a,
		print_appraiser_19a = appr_notice_config_maint.print_appraiser_19a,
		print_tax_due_19a = appr_notice_config_maint.print_tax_due_19a,
		print_hs_cap_value_19a = appr_notice_config_maint.print_hs_cap_value_19a,
		print_freeze_year_19a = appr_notice_config_maint.print_freeze_year_19a,
		print_id_type_19a = appr_notice_config_maint.print_id_type_19a,
		print_land_imprv_19i = appr_notice_config_maint.print_land_imprv_19i,
		print_freeze_19i = appr_notice_config_maint.print_freeze_19i,
		print_prior_year_19i = appr_notice_config_maint.print_prior_year_19i,
		print_appraiser_19i = appr_notice_config_maint.print_appraiser_19i,
		print_dt = null
	from
		appr_notice_config_maint with (nolock)
	where
		appr_notice_selection_criteria.notice_yr = appr_notice_config_maint.notice_yr
	and	appr_notice_selection_criteria.notice_num = @input_notice_num
	and	appr_notice_selection_criteria.notice_yr = @input_notice_yr
end

GO

