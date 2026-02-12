









CREATE procedure UpdateApprNoticePropList2519AOptions

@input_notice_yr	numeric(4),
@input_notice_num	int

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
declare @use_group_codes_list		char(1)
declare @use_last_owner_change_19i	char(1)
declare @last_owner_change_date_19i	datetime
declare @use_last_appr_year_19i       	char(1)                                                                                                    
declare @last_appr_year_19i     	numeric(4)

if exists (select * 
	   from appr_notice_selection_criteria
           where notice_yr  = @input_notice_yr
	   and   notice_num = @input_notice_num)
begin 
	

	select  
		@use_assessed		   = use_assd_19a,
		@use_market		   = use_mkt_19a,
		@use_code_19a                = use_include_code_19a,
		@use_code_19ac		  = use_include_code_19ac,
		@use_exclude_code_19a  = use_exclude_code_x19a, 
		@use_rend_19a                 = use_include_props_w_rend_19a,
		@rend_19a_option	    = rend_19a_option,
		@real_option                   = real_option,
		@personal_option          = personal_option,
		@mineral_option           = mineral_option,
		@mobile_option            = mobile_option,
		@auto_option              = auto_option,
		@shared_prop_option = shared_prop_option,
		@use_value_inc_greater_19a = use_value_inc_greater_than_19a,
		@inc_amt_19a	           = value_inc_greater_than_19a,
		@use_value_decr_less_19a   = use_value_decr_less_than_19a,
		@decr_amt_19a		   = value_decr_less_than_19a,
		@use_new_prop_19a 	   = use_new_prop_19a,
		@use_group_codes_list = use_group_codes_list,
		@use_last_owner_change_19i  = use_last_owner_change_19i,
		@last_owner_change_date_19i = last_owner_change_date_19i,
		@use_last_appr_year_19i     = use_last_appr_year_19i,                                                                                                         
		@last_appr_year_19i         = last_appr_year_19i

	from appr_notice_selection_criteria
	where notice_yr  = @input_notice_yr
	and   notice_num = @input_notice_num

	
	if (@use_group_codes_list = 'T')
	begin
		update
			appr_notice_prop_list
		set
			code_list = 'T'
		from
			appr_notice_prop_list_group_code as anplgc with (nolock)
		inner join
			appr_notice_prop_list as anpl with (nolock)
		on
			anpl.notice_yr = anplgc.notice_yr
		and	anpl.notice_num = anplgc.notice_num
		and	anpl.prop_id = anplgc.prop_id
		where
			anplgc.notice_yr = @input_notice_yr
		and	anplgc.notice_num = @input_notice_num


		update
			appr_notice_prop_list
		set
			code_x19a = 'T'
		from
			appr_notice_prop_list_group_code as anplgc with (nolock)
		inner join
			appr_notice_prop_list as anpl with (nolock)
		on
			anpl.notice_yr = anplgc.notice_yr
		and	anpl.notice_num = anplgc.notice_num
		and	anpl.prop_id = anplgc.prop_id
		where
			anplgc.notice_yr = @input_notice_yr
		and	anplgc.notice_num = @input_notice_num
		and	anplgc.prop_group_cd = '25.19A'


		update
			appr_notice_prop_list
		set
			code_x19ac = 'T'
		from
			appr_notice_prop_list_group_code as anplgc with (nolock)
		inner join
			appr_notice_prop_list as anpl with (nolock)
		on
			anpl.notice_yr = anplgc.notice_yr
		and	anpl.notice_num = anplgc.notice_num
		and	anpl.prop_id = anplgc.prop_id
		where
			anplgc.notice_yr = @input_notice_yr
		and	anplgc.notice_num = @input_notice_num
		and	anplgc.prop_group_cd = '25.19AC'
	end


	if (@use_new_prop_19a = 'T')
	begin
		update appr_notice_prop_list set value_new_prop_19a = 'T'
		from property
		where appr_notice_prop_list.prop_id = property.prop_id
		and not exists (select * from property_val pv, prop_supp_assoc psa
	    				where psa.prop_id = pv.prop_id
	    				and   psa.sup_num = pv.sup_num
	    				and   psa.owner_tax_yr = pv.prop_val_yr
	    				and   pv.prop_id = property.prop_id
	    				and   pv.prop_val_yr = (@input_notice_yr - 1))
	end

	if (@use_value_decr_less_19a = 'T')
	begin
		if (@use_assessed = 'T')
		begin

			update appr_notice_prop_list set value_decr_19a = 'T'
			from curr_prop_prev_value_vw
			where appr_notice_prop_list.prop_id = curr_prop_prev_value_vw.prop_id
			and   appr_notice_prop_list.sup_yr  = curr_prop_prev_value_vw.owner_tax_yr
			and   appr_notice_prop_list.sup_num = curr_prop_prev_value_vw.sup_num
			and   appr_notice_prop_list.notice_yr  = @input_notice_yr
			and   appr_notice_prop_list.notice_num = @input_notice_num
			and   (appr_notice_prop_list.value_decr_19a <> 'T' 
			or     appr_notice_prop_list.value_decr_19a is null)
			and   (assessed_val - prev_assessed) < 0
			and   ((assessed_val - prev_assessed) * -1) >= @decr_amt_19a

		end
		else
		begin

			update appr_notice_prop_list set value_decr_19a = 'T'
			from curr_prop_prev_value_vw
			where appr_notice_prop_list.prop_id = curr_prop_prev_value_vw.prop_id
			and   appr_notice_prop_list.sup_yr  = curr_prop_prev_value_vw.owner_tax_yr
			and   appr_notice_prop_list.sup_num = curr_prop_prev_value_vw.sup_num
			and   appr_notice_prop_list.notice_yr  = @input_notice_yr
			and   appr_notice_prop_list.notice_num = @input_notice_num
			and   (appr_notice_prop_list.value_decr_19a <> 'T' 
			or     appr_notice_prop_list.value_decr_19a is null)
			and   (market - prev_market) < 0
			and   ((market - prev_market) * -1) >= @decr_amt_19a

		end
	end

	if (@use_value_inc_greater_19a = 'T')
	begin

		if (@use_assessed = 'T')
		begin

			update appr_notice_prop_list set value_inc_19a = 'T'
			from curr_prop_prev_value_vw
			where appr_notice_prop_list.prop_id = curr_prop_prev_value_vw.prop_id
			and   appr_notice_prop_list.sup_yr  = curr_prop_prev_value_vw.owner_tax_yr
			and   appr_notice_prop_list.sup_num = curr_prop_prev_value_vw.sup_num
			and   appr_notice_prop_list.notice_yr  = @input_notice_yr
			and   appr_notice_prop_list.notice_num = @input_notice_num
			and   (appr_notice_prop_list.value_inc_19a <> 'T' 
			or     appr_notice_prop_list.value_inc_19a is null)
			and   (assessed_val - prev_assessed) >= @inc_amt_19a

		end
		else
		begin
	
			update appr_notice_prop_list set value_inc_19a = 'T'
			from curr_prop_prev_value_vw
			where appr_notice_prop_list.prop_id = curr_prop_prev_value_vw.prop_id
			and   appr_notice_prop_list.sup_yr  = curr_prop_prev_value_vw.owner_tax_yr
			and   appr_notice_prop_list.sup_num = curr_prop_prev_value_vw.sup_num
			and   appr_notice_prop_list.notice_yr  = @input_notice_yr
			and   appr_notice_prop_list.notice_num = @input_notice_num
			and   (appr_notice_prop_list.value_inc_19a <> 'T' 
			or     appr_notice_prop_list.value_inc_19a is null)
			and   (market - prev_market) >= @inc_amt_19a

		end
	end

	if (@use_rend_19a = 'T')
	begin
		if (@real_option = 'S') or (@mobile_option = 's') or (@mineral_option = 's') or (@auto_option = 'S')
		begin
	
			if(@rend_19a_option = 'A')

			begin
				update appr_notice_prop_list set rend_19a = 'T'
				from    prop_supp_assoc, property, property_val

				where  prop_supp_assoc.owner_tax_yr = @input_notice_yr
				and    prop_supp_assoc.prop_id            =  appr_notice_prop_list.prop_id
				and    prop_supp_assoc.owner_tax_yr  = property_val.prop_val_yr
				and    prop_supp_assoc.sup_num         = property_val.sup_num
				and    prop_supp_assoc.prop_id           =  property_val.prop_id
				and    prop_supp_assoc.prop_id           = property.prop_id
				and    (property.prop_type_cd  = 'R'
				or       property.prop_type_cd  = 'MH'
				or       property.prop_type_cd = 'MN'
				or       property.prop_type_cd = 'A')
				and    property_val.prop_inactive_dt is null
				and    property_val.rendered_yr	    = @input_notice_yr
			end
			else
			begin
				update appr_notice_prop_list set rend_19a_ar = 'T'
				from   prop_supp_assoc, property, property_val
				where  prop_supp_assoc.owner_tax_yr = @input_notice_yr
				and    prop_supp_assoc.prop_id            =  appr_notice_prop_list.prop_id
				and    prop_supp_assoc.owner_tax_yr  = property_val.prop_val_yr
				and    prop_supp_assoc.sup_num         = property_val.sup_num
				and    prop_supp_assoc.prop_id           =  property_val.prop_id
				and    prop_supp_assoc.prop_id           = property.prop_id
				and    (property.prop_type_cd  = 'R'
				or       property.prop_type_cd  = 'MH'
				or       property.prop_type_cd = 'MN'
				or       property.prop_type_cd = 'A')
				and    property_val.prop_inactive_dt is null
				and    property_val.rendered_yr	    = @input_notice_yr
				and    property_val.assessed_val    > property_val.rendered_val
			end
		end


		if (@personal_option = 'S')
		begin
			if(@rend_19a_option = 'A')
			begin
				update appr_notice_prop_list set 	rend_19a = 'T'
				from   prop_supp_assoc, property, property_val
				where  prop_supp_assoc.owner_tax_yr = @input_notice_yr
				and    prop_supp_assoc.prop_id      = property_val.prop_id
				and    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr
				and    prop_supp_assoc.sup_num      = property_val.sup_num
				and    property_val.prop_inactive_dt is null
				and    prop_supp_assoc.prop_id      = property.prop_id
				and    property.prop_type_cd        = 'P'
				and    exists (select * 
					       from pers_prop_rendition
					       where prop_id        = prop_supp_assoc.prop_id
					       and   rendition_year = prop_supp_assoc.owner_tax_yr)
    			end
			else
			begin
				update appr_notice_prop_list set rend_19a_ar = 'T'
				from   prop_supp_assoc, property, property_val
				where  prop_supp_assoc.owner_tax_yr = @input_notice_yr
				and    prop_supp_assoc.prop_id      = property_val.prop_id
				and    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr
				and    prop_supp_assoc.sup_num      = property_val.sup_num
				and    property_val.prop_inactive_dt is null
				and    prop_supp_assoc.prop_id      = property.prop_id
				and    property.prop_type_cd        = 'P'
				and    property_val.assessed_val > (select sum(rendition_value)
					       			    from pers_prop_rendition
					       			    where prop_id        = prop_supp_assoc.prop_id
					       			    and   rendition_year = prop_supp_assoc.owner_tax_yr)
			end
		end
				
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

	if (@use_exclude_code_19a = 'T')
	begin
		delete from appr_notice_prop_list_group_code
		from prop_group_assoc
		where appr_notice_prop_list_group_code.prop_id = prop_group_assoc.prop_id
		and     appr_notice_prop_list_group_code.notice_num = @input_notice_num
		and     appr_notice_prop_list_group_code.notice_yr = @input_notice_yr
		and   (prop_group_assoc.prop_group_cd = 'X25.19A'
		or      prop_group_assoc.prop_group_cd = 'X25.19I')
		and   not exists ( select * 
				  from prop_group_assoc
				  where prop_group_assoc.prop_id = appr_notice_prop_list_group_code.prop_id
			  	and   prop_group_assoc.prop_group_cd = 'FN')


		delete from appr_notice_prop_list 
		from prop_group_assoc
		where appr_notice_prop_list.prop_id = prop_group_assoc.prop_id
		and     appr_notice_prop_list.notice_num = @input_notice_num
		and     appr_notice_prop_list.notice_yr = @input_notice_yr
		and   (prop_group_assoc.prop_group_cd = 'X25.19A'
		or      prop_group_assoc.prop_group_cd = 'X25.19I')
		and   not exists ( select * 
				  from prop_group_assoc
				  where prop_group_assoc.prop_id = appr_notice_prop_list.prop_id
			  	and   prop_group_assoc.prop_group_cd = 'FN')
	end
	
end

GO

