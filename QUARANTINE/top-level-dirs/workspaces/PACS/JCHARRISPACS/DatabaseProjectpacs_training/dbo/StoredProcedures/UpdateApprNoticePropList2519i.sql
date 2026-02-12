


CREATE procedure UpdateApprNoticePropList2519i

@input_notice_yr	numeric(4),
@input_notice_num	int

as

declare @use_code_19i 	  		char(1)
declare @use_code_19ic			char(1)
declare @use_rend_19i	  		char(1)
declare @real_option	  		char(1)
declare @personal_option 		char(1)
declare @mineral_option  		char(1)
declare @mobile_option	  		char(1)
declare @auto_option	  		char(1)
declare @shared_prop_option		char(1)
declare @use_value_inc_greater_19i 	char(1)
declare @use_value_decr_less_19i   	char(1)
declare @inc_amt_19i	     		numeric(14)
declare @decr_amt_19i	  		numeric(14)
declare @use_assessed	  		char(1)
declare @use_market		  	char(1)
declare @use_new_prop_19i		char(1)
declare @use_last_owner_change_19i	char(1)
declare @last_owner_change_date_19i	datetime
declare @use_last_appr_year_19i       	char(1)                                                                                                    
declare @last_appr_year_19i     	numeric(4)
declare @use_exclude_code_x19i 	char(1)

if exists (select * 
	   from appr_notice_selection_criteria
           where notice_yr  = @input_notice_yr
	   and   notice_num = @input_notice_num)
begin 
	/* log the current appraisal notice configuration maintenance infor on the selection criteria record */
	update appr_notice_selection_criteria
	set	 notice_line1 = appr_notice_config_maint.notice_line1,
		 notice_line2 = appr_notice_config_maint.notice_line2,
		 notice_line3 = appr_notice_config_maint.notice_line3, 
		 arb_hearing_dt = appr_notice_config_maint.arb_hearing_dt,
 		 arb_protest_due_dt = appr_notice_config_maint.arb_protest_due_dt,
 		 arb_location = appr_notice_config_maint.arb_location,
 		 print_prop_id_19a = appr_notice_config_maint.print_prop_id_19a,
		 print_prior_year_19a = appr_notice_config_maint.print_prior_year_19a,
		 print_appraiser_19a = appr_notice_config_maint.print_appraiser_19a,
		 print_tax_due_19a = appr_notice_config_maint.print_tax_due_19a,
		 print_land_imprv_19i = appr_notice_config_maint.print_land_imprv_19i,
		 print_freeze_19i = appr_notice_config_maint.print_freeze_19i,
		 print_prior_year_19i = appr_notice_config_maint.print_prior_year_19i,
		 print_appraiser_19i  = appr_notice_config_maint.print_appraiser_19i,
		print_dt = null
	from appr_notice_config_maint
	where appr_notice_selection_criteria.notice_yr = appr_notice_config_maint.notice_yr
	and     appr_notice_selection_criteria.notice_num = @input_notice_num
	and		appr_notice_selection_criteria.notice_yr = @input_notice_yr

end

GO

