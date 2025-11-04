
CREATE procedure UpdateApprNoticePropList2519IPersonal

@input_notice_yr	numeric(4),
@input_notice_num	int

as

declare @use_code_19i 	  		char(1)
declare @use_code_19ic			char(1)
declare @use_rend_19i	  		char(1)
declare @personal_option	  		char(1)
declare @real_option 		char(1)
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

	select  @use_last_owner_change_19i  = use_last_owner_change_19i,
		@last_owner_change_date_19i = last_owner_change_date_19i,
		@use_last_appr_year_19i     = use_last_appr_year_19i,                                                                                                         
		@last_appr_year_19i         = last_appr_year_19i,
		@use_code_19i               = use_include_code_19i,
		@use_code_19ic		    = use_include_code_19ic,
		@use_exclude_code_x19i     = use_exclude_code_x19i,
		@personal_option               = real_option,
		@personal_option           = personal_option,
		@mineral_option            = mineral_option,
		@mobile_option             = mobile_option,
		@auto_option               = auto_option,
		@shared_prop_option  = shared_prop_option

	from appr_notice_selection_criteria
	where notice_yr  = @input_notice_yr
	and   notice_num = @input_notice_num

	/* select all real */
	if (@personal_option = 'A')
	begin
		insert into appr_notice_prop_list
		(
		notice_yr, 
		notice_num,  
		prop_id,     
		owner_id,    
		sup_num,     
		sup_yr,
		all_personal
		)
		select @input_notice_yr,
		       	@input_notice_num,
		       	prop_supp_assoc.prop_id,
		       	owner.owner_id,
		       	prop_supp_assoc.sup_num,
		       	prop_supp_assoc.owner_tax_yr,	
		       	'T'
		from   owner, prop_supp_assoc, property, property_val
		where  prop_supp_assoc.owner_tax_yr = @input_notice_yr
		and    prop_supp_assoc.prop_id      = owner.prop_id
		and    prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr
		and    prop_supp_assoc.sup_num      = owner.sup_num
		and    prop_supp_assoc.prop_id      = property.prop_id
		and    property.prop_type_cd        = 'P'
		and    prop_supp_assoc.prop_id      = property_val.prop_id

		and    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr
		and    prop_supp_assoc.sup_num      = property_val.sup_num
		and    property_val.prop_inactive_dt is null
		and    not exists (select * from shared_prop sp
						       where sp.pacs_prop_id = property_val.prop_id
						       and   sp.shared_year  = property_val.prop_val_yr
						       and   sp.sup_num		 = property_val.sup_num)   /* rk 02042004  */
		
		and not exists (select *
				from appr_notice_prop_list
				where notice_yr = @input_notice_yr
				and   notice_num = @input_notice_num
				and   prop_id    = prop_supp_assoc.prop_id)
		
	end
	/* select real based on selection criteria */
	else if (@personal_option = 'S')
	begin
		if (@use_code_19i = 'T')
		begin

			insert into appr_notice_prop_list
			(
			notice_yr, 
			notice_num,  
			prop_id,     
			owner_id,    
			sup_num,     
			sup_yr,  
			code_x19i
			)
			select    distinct
				@input_notice_yr,
		       		@input_notice_num,
		       		prop_supp_assoc.prop_id,
		       		owner.owner_id,
		       		prop_supp_assoc.sup_num,
		       		prop_supp_assoc.owner_tax_yr,	
		       		'T'
			from   owner, prop_supp_assoc, prop_group_assoc, property, property_val
			where  prop_supp_assoc.owner_tax_yr = @input_notice_yr
			and    prop_supp_assoc.prop_id      = owner.prop_id
			and    prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr
			and    prop_supp_assoc.sup_num      = owner.sup_num
			and    prop_supp_assoc.prop_id      = property.prop_id
			and    property.prop_type_cd        = 'P'
			and    prop_supp_assoc.prop_id      = property_val.prop_id
			and    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr
			and    prop_supp_assoc.sup_num      = property_val.sup_num
			and    property_val.prop_inactive_dt is null
			and    not exists (select * from shared_prop sp
						       where sp.pacs_prop_id = property_val.prop_id
						       and   sp.shared_year  = property_val.prop_val_yr
						       and   sp.sup_num		 = property_val.sup_num)   /* rk 02042004  */
		
			and    prop_supp_assoc.prop_id      = prop_group_assoc.prop_id
			and    prop_group_assoc.prop_group_cd = '25.19I'
			and    not exists (select * 
				   	from  appr_notice_prop_list
				   	where prop_id    = prop_supp_assoc.prop_id
				  	and   owner_id   = owner.owner_id
				   	and   sup_yr     = prop_supp_assoc.owner_tax_yr
				   	and   sup_num    = prop_supp_assoc.sup_num
				   	and   notice_yr  = @input_notice_yr
				   	and   notice_num = @input_notice_num)

		end

		if (@use_code_19ic = 'T')
		begin

			insert into appr_notice_prop_list
			(
			notice_yr, 
			notice_num,  
			prop_id,     
			owner_id,    
			sup_num,     
			sup_yr,  
			code_x19ic
			)
			select    distinct
				@input_notice_yr,
		       		@input_notice_num,
		       		prop_supp_assoc.prop_id,
		       		owner.owner_id,
		       		prop_supp_assoc.sup_num,
		       		prop_supp_assoc.owner_tax_yr,	
		       		'T'
			from   owner, prop_supp_assoc, prop_group_assoc, property, property_val
			where  prop_supp_assoc.owner_tax_yr = @input_notice_yr
			and    prop_supp_assoc.prop_id      = owner.prop_id
			and    prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr
			and    prop_supp_assoc.sup_num      = owner.sup_num
			and    prop_supp_assoc.prop_id      = property.prop_id
			and    property.prop_type_cd        = 'P'
			and    prop_supp_assoc.prop_id      = property_val.prop_id
			and    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr
			and    prop_supp_assoc.sup_num      = property_val.sup_num
			and    property_val.prop_inactive_dt is null
			and    not exists (select * from shared_prop sp
						       where sp.pacs_prop_id = property_val.prop_id
						       and   sp.shared_year  = property_val.prop_val_yr
						       and   sp.sup_num		 = property_val.sup_num)   /* rk 02042004  */
		
			and    prop_supp_assoc.prop_id      = prop_group_assoc.prop_id
			and    prop_group_assoc.prop_group_cd = '25.19IC'
			and    not exists (select * 
				   	from  appr_notice_prop_list
				   	where prop_id    = prop_supp_assoc.prop_id
				  	and   owner_id   = owner.owner_id
				   	and   sup_yr     = prop_supp_assoc.owner_tax_yr
				   	and   sup_num    = prop_supp_assoc.sup_num
				   	and   notice_yr  = @input_notice_yr
				   	and   notice_num = @input_notice_num)

		end

		if (@use_last_owner_change_19i = 'T')
		begin
			insert into appr_notice_prop_list
			(
			notice_yr, 
			notice_num,  
			prop_id,     
			owner_id,    
			sup_num,     
			sup_yr,  
			last_owner_change_19i
			)
			select    distinct
               			@input_notice_yr,
		       		@input_notice_num,
		       		prop_supp_assoc.prop_id,
		       		owner.owner_id,
		       		prop_supp_assoc.sup_num,
		       		prop_supp_assoc.owner_tax_yr,	
		       		'T'
			from   owner, prop_supp_assoc, property, property_val, chg_of_owner, chg_of_owner_prop_assoc
			where  prop_supp_assoc.owner_tax_yr = @input_notice_yr
			and    prop_supp_assoc.prop_id      = owner.prop_id
			and    prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr
			and    prop_supp_assoc.sup_num      = owner.sup_num
			and    prop_supp_assoc.prop_id      = property.prop_id
			and    property.prop_type_cd        = 'P'
			and    prop_supp_assoc.prop_id      = property_val.prop_id
			and    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr
			and    prop_supp_assoc.sup_num      = property_val.sup_num
			and    property_val.prop_inactive_dt is null
			and    not exists (select * from shared_prop sp
						       where sp.pacs_prop_id = property_val.prop_id
						       and   sp.shared_year  = property_val.prop_val_yr
						       and   sp.sup_num		 = property_val.sup_num)   /* rk 02042004  */
		
			and    prop_supp_assoc.prop_id = chg_of_owner_prop_assoc.prop_id
			and    chg_of_owner_prop_assoc.chg_of_owner_id = chg_of_owner.chg_of_owner_id
			and    chg_of_owner.deed_dt >= @last_owner_change_date_19i
			and    not exists (select * 
				   	from  appr_notice_prop_list
				   	where prop_id    = prop_supp_assoc.prop_id
				  	and   owner_id   = owner.owner_id
				   	and   sup_yr     = prop_supp_assoc.owner_tax_yr
				   	and   sup_num    = prop_supp_assoc.sup_num
				   	and   notice_yr  = @input_notice_yr
				   	and   notice_num = @input_notice_num)
		end

		if (@use_last_appr_year_19i = 'T')
		begin

			insert into appr_notice_prop_list
			(
			notice_yr, 
			notice_num,  
			prop_id,     
			owner_id,    
			sup_num,     
			sup_yr,  
			last_appr_yr_19i
			)
			select  distinct
				@input_notice_yr,
		       		@input_notice_num,
		       		prop_supp_assoc.prop_id,
				owner.owner_id,
		       		prop_supp_assoc.sup_num,
		       		prop_supp_assoc.owner_tax_yr,	
		       		'T'
			from   owner, prop_supp_assoc, property, property_val
			where  prop_supp_assoc.owner_tax_yr = @input_notice_yr
			and    prop_supp_assoc.prop_id      = owner.prop_id
			and    prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr
			and    prop_supp_assoc.sup_num      = owner.sup_num
			and    prop_supp_assoc.prop_id      = property.prop_id
			and    property.prop_type_cd        = 'P'
			and    prop_supp_assoc.prop_id      = property_val.prop_id
			and    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr
			and    prop_supp_assoc.sup_num      = property_val.sup_num
			and    property_val.prop_inactive_dt is null
			and    not exists (select * from shared_prop sp
						       where sp.pacs_prop_id = property_val.prop_id
						       and   sp.shared_year  = property_val.prop_val_yr
						       and   sp.sup_num		 = property_val.sup_num)   /* rk 02042004  */
		
			and    property_val.last_appraisal_yr > @last_appr_year_19i 
			and    not exists (select * 
				   	from  appr_notice_prop_list
				   	where prop_id    = prop_supp_assoc.prop_id
				  	and   owner_id   = owner.owner_id
				   	and   sup_yr     = prop_supp_assoc.owner_tax_yr
				   	and   sup_num    = prop_supp_assoc.sup_num
				   	and   notice_yr  = @input_notice_yr
				   	and   notice_num = @input_notice_num)
		end
					
	end 
end

GO

