








CREATE procedure UpdateApprNoticePropList2519IOptions
@input_notice_yr	numeric(4),
@input_notice_num	int

as

declare @use_code_19i 	  		char(1)
declare @use_code_19ic			char(1)
declare @use_rend_19i	  		char(1)
declare @personal_option	  	char(1)
declare @real_option 			char(1)
declare @mineral_option  		char(1)
declare @auto_option	  		char(1)
declare @mobile_option	  		char(1)
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
declare @use_exclude_code_x19a 	char(1)

if exists (select * 
	   from appr_notice_selection_criteria
           where notice_yr  = @input_notice_yr
	   and   notice_num = @input_notice_num)
begin 

	select  @use_last_owner_change_19i  = use_last_owner_change_19i,
		@last_owner_change_date_19i = last_owner_change_date_19i,
		@use_last_appr_year_19i     = use_last_appr_year_19i,                                                                                                         
		@last_appr_year_19i         = last_appr_year_19i,
		@use_code_19i               = use_include_code_19i,
		@use_code_19ic		    = use_include_code_19ic,
		@use_exclude_code_x19i     = use_exclude_code_x19i,
		@use_exclude_code_x19a     = use_exclude_code_x19a,
		@auto_option               = real_option,
		@auto_option           = personal_option,
		@auto_option            = mineral_option,
		@auto_option             = mobile_option,
		@auto_option               = auto_option,
		@shared_prop_option  = shared_prop_option

	from appr_notice_selection_criteria
	where notice_yr  = @input_notice_yr
	and   notice_num = @input_notice_num

	
	if ( @use_code_19i = 'T')
	begin
		update appr_notice_prop_list set code_x19i = 'T'
		from prop_group_assoc
		where appr_notice_prop_list.prop_id    = prop_group_assoc.prop_id
		and   appr_notice_prop_list.notice_yr  = @input_notice_yr
		and   appr_notice_prop_list.notice_num = @input_notice_num
		and   (appr_notice_prop_list.code_x19i <> 'T' 
		or    appr_notice_prop_list.code_x19i is null)
		and    appr_notice_prop_list.prop_id   = prop_group_assoc.prop_id
		and    prop_group_assoc.prop_group_cd  = '25.19I'
	end

	if ( @use_code_19ic = 'T')
	begin
		update appr_notice_prop_list set code_x19ic = 'T'
		from prop_group_assoc
		where appr_notice_prop_list.prop_id    = prop_group_assoc.prop_id
		and   appr_notice_prop_list.notice_yr  = @input_notice_yr
		and   appr_notice_prop_list.notice_num = @input_notice_num
		and   (appr_notice_prop_list.code_x19ic <> 'T' 
		or    appr_notice_prop_list.code_x19ic is null)
		and    appr_notice_prop_list.prop_id   = prop_group_assoc.prop_id
		and    prop_group_assoc.prop_group_cd  = '25.19IC'
	end

	if (@use_last_owner_change_19i = 'T')
	begin
		update appr_notice_prop_list set last_owner_change_19i = 'T'
		from   chg_of_owner, chg_of_owner_prop_assoc
		where  appr_notice_prop_list.prop_id = chg_of_owner_prop_assoc.prop_id
		and    chg_of_owner_prop_assoc.chg_of_owner_id = chg_of_owner.chg_of_owner_id
		and    chg_of_owner.deed_dt >= @last_owner_change_date_19i
	end

	if (@use_last_appr_year_19i = 'T')
	begin
		update appr_notice_prop_list set last_appr_yr_19i = 'T'
		from   appr_notice_prop_list , property, property_val, prop_supp_assoc
		where property.prop_id = appr_notice_prop_list.prop_id
		and    property_val.last_appraisal_yr > @last_appr_year_19i
		and    property_val.prop_id = property.prop_id
		and    prop_supp_assoc.prop_id = property_val.prop_id
		and    prop_supp_assoc.sup_num = property_val.sup_num
		and    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr
		and    prop_supp_assoc.owner_tax_yr = @input_notice_yr
	end

	if (@use_exclude_code_x19i  = 'T' or 
	    @use_exclude_code_x19a = 'T')
	begin
		delete from appr_notice_prop_list 
		from prop_group_assoc
		where appr_notice_prop_list.prop_id = prop_group_assoc.prop_id
		and   appr_notice_prop_list.notice_num = @input_notice_num
		and   appr_notice_prop_list.notice_yr = @input_notice_yr
		and   (prop_group_assoc.prop_group_cd = 'X25.19A'
		or      prop_group_assoc.prop_group_cd = 'X25.19I')
		and   not exists (select * 
			  	from prop_group_assoc
			  	where prop_group_assoc.prop_id = appr_notice_prop_list.prop_id
			 	 and   prop_group_assoc.prop_group_cd = 'FN')
	end
end

GO

