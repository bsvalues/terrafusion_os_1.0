









CREATE procedure UpdateApprNoticePropListSpecialGroupOptions

@input_notice_yr	numeric(4),
@input_notice_num	int,
@input_special_group_id	int

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

if exists
(
	select
		* 
	from
		appr_notice_selection_criteria with (nolock)
	where
		notice_yr = @input_notice_yr
	and	notice_num = @input_notice_num
	and	use_special_group_selection = 'T'
)
begin 
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
		@use_new_prop_19a = use_new_prop_19a,
		@use_group_codes_list = use_group_codes_list,
		@use_last_owner_change_19i = use_last_owner_change_19i,
		@last_owner_change_date_19i = last_owner_change_date_19i,
		@use_last_appr_year_19i = use_last_appr_year_19i,                                                                                                         
		@last_appr_year_19i = last_appr_year_19i
	from
		appr_notice_selection_criteria with (nolock)
	where
		notice_yr = @input_notice_yr
	and	notice_num = @input_notice_num

	
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
		and	anpl.special_group_id = anplgc.special_group_id
		where
			anplgc.notice_yr = @input_notice_yr
		and	anplgc.notice_num = @input_notice_num
		and	anplgc.special_group_id = @input_special_group_id


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
		and	anpl.special_group_id = anplgc.special_group_id
		where
			anplgc.notice_yr = @input_notice_yr
		and	anplgc.notice_num = @input_notice_num
		and	anplgc.special_group_id = @input_special_group_id
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
		and	anpl.special_group_id = anplgc.special_group_id
		where
			anplgc.notice_yr = @input_notice_yr
		and	anplgc.notice_num = @input_notice_num
		and	anplgc.special_group_id = @input_special_group_id
		and	anplgc.prop_group_cd = '25.19AC'
	end

	if (@use_new_prop_19a = 'T')
	begin
		update
			appr_notice_prop_list
		set
			value_new_prop_19a = 'T'
		from
			appr_notice_prop_list as anpl with (nolock)
		inner join
			property as p with (nolock)
		on
			p.prop_id = anpl.prop_id
		where
			anpl.notice_yr = @input_notice_yr
		and	anpl.notice_num = @input_notice_num
		and	anpl.special_group_id = @input_special_group_id
		and	not exists
		(
			select
				*
			from
				prop_supp_assoc as psa with (nolock)
			inner join
				property_val as pv with (nolock)
			on
				pv.prop_id = psa.prop_id
			and	pv.prop_val_yr = psa.owner_tax_yr
			and	pv.sup_num = psa.sup_num
			where
				psa.prop_id = anpl.prop_id
			and	psa.owner_tax_yr = (@input_notice_yr - 1)
		)
	end

	if (@use_value_decr_less_19a = 'T')
	begin
		if (@use_assessed = 'T')
		begin
			update
				appr_notice_prop_list
			set
				value_decr_19a = 'T'
			from
				appr_notice_prop_list as anpl with (nolock)
			inner join
				curr_prop_prev_value_vw as cppvv with (nolock)
			on
				cppvv.prop_id = anpl.prop_id
			and	cppvv.owner_tax_yr = anpl.sup_yr
			and	cppvv.sup_num = anpl.sup_num
			and	(cppvv.assessed_val - cppvv.prev_assessed) < 0
			and	((cppvv.assessed_val - cppvv.prev_assessed) * -1) >= @decr_amt_19a
			where
				anpl.notice_yr = @input_notice_yr
			and	anpl.notice_num = @input_notice_num
			and	anpl.special_group_id = @input_special_group_id
		end
		else
		begin
			update
				appr_notice_prop_list
			set
				value_decr_19a = 'T'
			from
				appr_notice_prop_list as anpl with (nolock)
			inner join
				curr_prop_prev_value_vw as cppvv with (nolock)
			on
				cppvv.prop_id = anpl.prop_id
			and	cppvv.owner_tax_yr = anpl.sup_yr
			and	cppvv.sup_num = anpl.sup_num
			and	(cppvv.market - cppvv.prev_market) < 0
			and	((cppvv.market - cppvv.prev_market) * -1) >= @decr_amt_19a
			where
				anpl.notice_yr = @input_notice_yr
			and	anpl.notice_num = @input_notice_num
			and	anpl.special_group_id = @input_special_group_id
		end
	end

	if (@use_value_inc_greater_19a = 'T')
	begin
		if (@use_assessed = 'T')
		begin
			update
				appr_notice_prop_list
			set
				value_inc_19a = 'T'
			from
				appr_notice_prop_list as anpl with (nolock)
			inner join
				curr_prop_prev_value_vw as cppvv with (nolock)
			on
				cppvv.prop_id = anpl.prop_id
			and	cppvv.owner_tax_yr = anpl.sup_yr
			and	cppvv.sup_num = anpl.sup_num
			and	(cppvv.assessed_val - cppvv.prev_assessed) >= @inc_amt_19a
			where
				anpl.notice_yr = @input_notice_yr
			and	anpl.notice_num = @input_notice_num
			and	anpl.special_group_id = @input_special_group_id
		end
		else
		begin
			update
				appr_notice_prop_list
			set
				value_inc_19a = 'T'
			from
				appr_notice_prop_list as anpl with (nolock)
			inner join
				curr_prop_prev_value_vw as cppvv with (nolock)
			on
				cppvv.prop_id = anpl.prop_id
			and	cppvv.owner_tax_yr = anpl.sup_yr
			and	cppvv.sup_num = anpl.sup_num
			and	(cppvv.market - cppvv.prev_market) >= @inc_amt_19a
			where
				anpl.notice_yr = @input_notice_yr
			and	anpl.notice_num = @input_notice_num
			and	anpl.special_group_id = @input_special_group_id
		end
	end

	if (@use_rend_19a = 'T')
	begin
		if (@real_option = 'S') or (@mobile_option = 's') or (@mineral_option = 's') or (@auto_option = 'S')
		begin
			if (@rend_19a_option = 'A')
			begin
				update
					appr_notice_prop_list
				set
					rend_19a = 'T'
				from
					appr_notice_prop_list as anpl with (nolock)
				inner join
					property as p with (nolock)
				on
					p.prop_id = anpl.prop_id
				and	p.prop_type_cd in ('R', 'MH', 'MN', 'A')
				inner join
					prop_supp_assoc as psa with (nolock)
				on
					psa.prop_id = anpl.prop_id
				and	psa.owner_tax_yr = anpl.sup_yr
				and	psa.sup_num = anpl.sup_num
				inner join
					property_val as pv with (nolock)
				on
					pv.prop_id = psa.prop_id
				and	pv.prop_val_yr = psa.owner_tax_yr
				and	pv.sup_num = psa.sup_num
				and	pv.prop_inactive_dt is null
				and	pv.rendered_yr = pv.prop_val_yr
				where
					anpl.notice_yr = @input_notice_yr
				and	anpl.notice_num = @input_notice_num
				and	anpl.special_group_id = @input_special_group_id
			end
			else
			begin
				update
					appr_notice_prop_list
				set
					rend_19a_ar = 'T'
				from
					appr_notice_prop_list as anpl with (nolock)
				inner join
					property as p with (nolock)
				on
					p.prop_id = anpl.prop_id
				and	p.prop_type_cd in ('R', 'MH', 'MN', 'A')
				inner join
					prop_supp_assoc as psa with (nolock)
				on
					psa.prop_id = anpl.prop_id
				and	psa.owner_tax_yr = anpl.sup_yr
				and	psa.sup_num = anpl.sup_num
				inner join
					property_val as pv with (nolock)
				on
					pv.prop_id = psa.prop_id
				and	pv.prop_val_yr = psa.owner_tax_yr
				and	pv.sup_num = psa.sup_num
				and	pv.prop_inactive_dt is null
				and	pv.rendered_yr = pv.prop_val_yr
				and	pv.assessed_val > pv.rendered_val
				where
					anpl.notice_yr = @input_notice_yr
				and	anpl.notice_num = @input_notice_num
				and	anpl.special_group_id = @input_special_group_id
			end
		end


		if (@personal_option = 'S')
		begin
			if(@rend_19a_option = 'A')
			begin
				update
					appr_notice_prop_list
				set
					rend_19a = 'T'
				from
					appr_notice_prop_list as anpl with (nolock)
				inner join
					property as p with (nolock)
				on
					p.prop_id = anpl.prop_id
				and	p.prop_type_cd = 'P'
				inner join
					prop_supp_assoc as psa with (nolock)
				on
					psa.prop_id = anpl.prop_id
				and	psa.owner_tax_yr = anpl.sup_yr
				and	psa.sup_num = anpl.sup_num
				inner join
					pers_prop_rendition as ppr with (nolock)
				on
					ppr.prop_id = psa.prop_id
				and	ppr.rendition_year = psa.owner_tax_yr
				inner join
					property_val as pv with (nolock)
				on
					pv.prop_id = psa.prop_id
				and	pv.prop_val_yr = psa.owner_tax_yr
				and	pv.sup_num = psa.sup_num
				and	pv.prop_inactive_dt is null
				where
					anpl.notice_yr = @input_notice_yr
				and	anpl.notice_num = @input_notice_num
				and	anpl.special_group_id = @input_special_group_id
    			end
			else
			begin
				update
					appr_notice_prop_list
				set
					rend_19a_ar = 'T'
				from
					appr_notice_prop_list as anpl with (nolock)
				inner join
					property as p with (nolock)
				on
					p.prop_id = anpl.prop_id
				and	p.prop_type_cd = 'P'
				inner join
					prop_supp_assoc as psa with (nolock)
				on
					psa.prop_id = anpl.prop_id
				and	psa.owner_tax_yr = anpl.sup_yr
				and	psa.sup_num = anpl.sup_num
				inner join
					property_val as pv with (nolock)
				on
					pv.prop_id = psa.prop_id
				and	pv.prop_val_yr = psa.owner_tax_yr
				and	pv.sup_num = psa.sup_num
				and	pv.prop_inactive_dt is null
				and	pv.assessed_val > 
					(
						select
							sum(ppr.rendition_value)
						from
							pers_prop_rendition as ppr with (nolock)
						where
							ppr.prop_id = psa.prop_id
						and	ppr.rendition_year = psa.owner_tax_yr
					)
				where
					anpl.notice_yr = @input_notice_yr
				and	anpl.notice_num = @input_notice_num
				and	anpl.special_group_id = @input_special_group_id
			end
		end
				
	end
		
	if (@use_last_owner_change_19i = 'T')
	begin
		update
			appr_notice_prop_list
		set
			last_owner_change_19i = 'T'
		from
			appr_notice_prop_list as anpl with (nolock)
		inner join
			chg_of_owner_prop_assoc as coopa with (nolock)
		on
			coopa.prop_id = anpl.prop_id
		inner join
			chg_of_owner as coo with (nolock)
		on
			coo.chg_of_owner_id = coopa.chg_of_owner_id
		and	coo.deed_dt > @last_owner_change_date_19i
		where
			anpl.notice_yr = @input_notice_yr
		and	anpl.notice_num = @input_notice_num
		and	anpl.special_group_id = @input_special_group_id
	end

	if (@use_last_appr_year_19i = 'T')
	begin
		update
			appr_notice_prop_list
		set
			last_appr_yr_19i = 'T'
		from
			appr_notice_prop_list as anpl with (nolock)
		inner join
			property as p with (nolock)
		on
			p.prop_id = anpl.prop_id
		inner join
			prop_supp_assoc as psa with (nolock)
		on
			psa.prop_id = anpl.prop_id
		and	psa.owner_tax_yr = anpl.sup_yr
		and	psa.sup_num = anpl.sup_num
		inner join
			property_val as pv with (nolock)
		on
			pv.prop_id = psa.prop_id
		and	pv.prop_val_yr = psa.owner_tax_yr
		and	pv.sup_num = psa.sup_num
		and	pv.prop_inactive_dt is null
		and	pv.last_appraisal_yr > @last_appr_year_19i
		where
			anpl.notice_yr = @input_notice_yr
		and	anpl.notice_num = @input_notice_num
		and	anpl.special_group_id = @input_special_group_id
	end

	if (@use_exclude_code_19a = 'T')
	begin
		delete
			appr_notice_prop_list_group_code
		from
			appr_notice_prop_list_group_code as anplgc with (nolock)
		inner join
			prop_group_assoc as pga with (nolock)
		on
			pga.prop_id = anplgc.prop_id
		and	pga.prop_group_cd in ('X25.19A', 'X25.19I')
		where
			anplgc.notice_yr = @input_notice_yr
		and	anplgc.notice_num = @input_notice_num
		and	anplgc.special_group_id = @input_special_group_id
		and	not exists
		(
			select
				*
			from
				prop_group_assoc as pga1 with (nolock)
			where
				pga1.prop_id = anplgc.prop_id
			and	pga1.prop_group_cd = 'FN'
		)


		delete
			appr_notice_prop_list
		from
			appr_notice_prop_list as anpl with (nolock)
		inner join
			prop_group_assoc as pga with (nolock)
		on
			pga.prop_id = anpl.prop_id
		and	pga.prop_group_cd in ('X25.19A', 'X25.19I')
		where
			anpl.notice_yr = @input_notice_yr
		and	anpl.notice_num = @input_notice_num
		and	anpl.special_group_id = @input_special_group_id
		and	not exists
		(
			select
				*
			from
				prop_group_assoc as pga1 with (nolock)
			where
				pga1.prop_id = anpl.prop_id
			and	pga1.prop_group_cd = 'FN'
		)
	end
end

GO

