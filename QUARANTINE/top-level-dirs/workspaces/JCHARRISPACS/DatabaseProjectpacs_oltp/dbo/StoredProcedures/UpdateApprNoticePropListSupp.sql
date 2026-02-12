


CREATE procedure UpdateApprNoticePropListSupp

@input_notice_yr	numeric(4),
@input_notice_num	int,
@input_sup_num		int,
@input_sup_yr		numeric(4)

as

declare @use_code_19a 	  		char(1)
declare @use_code_19ac			char(1)
declare @use_rend_19a	  		char(1)
declare @real_option	  		char(1)
declare @personal_option 		char(1)
declare @mineral_option  		char(1)
declare @mobile_option	  		char(1)
declare @auto_option	  		char(1)
declare @shared_prop_option		char(1)
declare @use_value_inc_greater_19a 	char(1)
declare @use_value_decr_less_19a   	char(1)
declare @inc_amt_19a	     		numeric(14)
declare @decr_amt_19a	  		numeric(14)
declare @use_assessed	  		char(1)
declare @use_market		  	char(1)
declare @use_new_prop_19a		char(1)
declare @rend_19a_option		char(5)
declare @use_exclude_code_19a		char(1)

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
	/* log the current appraisal notice configuration maintenance info on the selection criteria record */
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


	select  
		@use_assessed = use_assd_19a,
		@use_market = use_mkt_19a,
		@use_code_19a = use_include_code_19a,
		@use_code_19ac = use_include_code_19ac,
		@use_exclude_code_19a = use_exclude_code_x19a, 
		@use_rend_19a = use_include_props_w_rend_19a,
		@rend_19a_option = rend_19a_option,
		@real_option = real_option,
		@personal_option = personal_option,
		@mineral_option = mineral_option,
		@mobile_option = mobile_option,
		@auto_option = auto_option,
		@shared_prop_option = shared_prop_option,
		@use_value_inc_greater_19a = use_value_inc_greater_than_19a,
		@inc_amt_19a = value_inc_greater_than_19a,
		@use_value_decr_less_19a = use_value_decr_less_than_19a,
		@decr_amt_19a = value_decr_less_than_19a,
		@use_new_prop_19a = use_new_prop_19a 
	from
		appr_notice_selection_criteria with (nolock)
	where
		notice_yr = @input_notice_yr
	and	notice_num = @input_notice_num


	insert into appr_notice_prop_list
	(
		notice_yr, 
		notice_num,  
		prop_id,     
		owner_id,    
		notice_owner_id,    
		sup_num,     
		sup_yr,
		all_real
	)
	select
		@input_notice_yr,
		@input_notice_num,
		property_val.prop_id,
		owner.owner_id,
		owner.owner_id,
		property_val.sup_num,
		property_val.prop_val_yr,	
		'T'
	from
		property_val with (nolock)
	join
		property with (nolock)
	on
		property_val.prop_id = property.prop_id
	join
		owner with (nolock)
	on
		property_val.prop_id = owner.prop_id
	and	property_val.prop_val_yr = owner.owner_tax_yr
	and	property_val.sup_num = owner.sup_num
	where
		property_val.prop_val_yr = @input_sup_yr
	and	property_val.sup_num = @input_sup_num
	and	property_val.prop_inactive_dt is null
	and not exists
	(
		select
			*
		from
			appr_notice_prop_list with (nolock)
		where
			notice_yr = @input_notice_yr
		and	notice_num = @input_notice_num
		and	prop_id = property_val.prop_id
		and	sup_yr = @input_sup_yr
		and	sup_num = @input_sup_num
	)
end

GO

