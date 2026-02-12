



CREATE procedure UpdateApprNoticePropListSpecialGroupShared


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

	/* select all shared */
	if (@shared_prop_option = 'A')
	begin
		insert into
			appr_notice_prop_list
		(
			notice_yr,
			notice_num,
			prop_id,
			owner_id,
			notice_owner_id,
			sup_num,
			sup_yr,
			special_group_id,
			all_shared
		)
		select
			@input_notice_yr,
			@input_notice_num,
			psa.prop_id,
			o.owner_id,
			o.owner_id,
			psa.sup_num,
			psa.owner_tax_yr,
			@input_special_group_id,
			'T'
		from
			special_group_prop_assoc as sgpa with (nolock)
		inner join
			special_group as sg with (nolock)
		on
			sg.special_group_id = sgpa.special_group_id
		inner join
			property as p with (nolock)
		on
			p.prop_id = sgpa.prop_id
		inner join
			prop_supp_assoc as psa with (nolock)
		on
			psa.prop_id = sgpa.prop_id
		and	psa.owner_tax_yr = sgpa.prop_val_yr
		inner join
			property_val as pv with (nolock)
		on
			pv.prop_id = psa.prop_id
		and	pv.prop_val_yr = psa.owner_tax_yr
		and	pv.sup_num = psa.sup_num
		and	pv.prop_inactive_dt is null
		inner join
			owner as o with (nolock)
		on
			o.prop_id = pv.prop_id
		and	o.owner_tax_yr = pv.prop_val_yr
		and	o.sup_num = pv.sup_num
		where
			sgpa.special_group_id = @input_special_group_id
		and	sgpa.prop_val_yr = @input_notice_yr
		and	exists
		(
			select
				*
			from
				shared_prop as sp with (nolock)
			where
				sp.pacs_prop_id = psa.prop_id
			and	sp.shared_year = psa.owner_tax_yr
			and	sp.sup_num = psa.sup_num
		)
		and	not exists
		(
			select
				*
			from
				appr_notice_prop_list as anpl with (nolock)
			where
				anpl.prop_id = psa.prop_id
			and	anpl.owner_id = o.owner_id
			and	anpl.notice_owner_id = o.owner_id
			and	anpl.sup_yr = psa.owner_tax_yr
			and	anpl.sup_num = psa.sup_num
			and	anpl.notice_yr = @input_notice_yr
			and	anpl.notice_num = @input_notice_num
		)
		
		union

		select
			@input_notice_yr,
			@input_notice_num,
			psa.prop_id,
			o.owner_id,
			o.owner_id,
			psa.sup_num,
			psa.owner_tax_yr,
			@input_special_group_id,
			'T'
		from
			special_group_owner_assoc as sgoa with (nolock)
		inner join
			special_group as sg with (nolock)
		on
			sg.special_group_id = sgoa.special_group_id
		inner join
			owner as o with (nolock)
		on
			o.owner_id = sgoa.owner_id
		and	o.owner_tax_yr = sgoa.owner_tax_yr
		inner join
			property as p with (nolock)
		on
			p.prop_id = o.prop_id
		inner join
			prop_supp_assoc as psa with (nolock)
		on
			psa.prop_id = o.prop_id
		and	psa.owner_tax_yr = o.owner_tax_yr
		and	psa.sup_num = o.sup_num
		inner join
			property_val as pv with (nolock)
		on
			pv.prop_id = psa.prop_id
		and	pv.prop_val_yr = psa.owner_tax_yr
		and	pv.sup_num = psa.sup_num
		and	pv.prop_inactive_dt is null
		where
			sgoa.special_group_id = @input_special_group_id
		and	sgoa.owner_tax_yr = @input_notice_yr
		and	exists
		(
			select
				*
			from
				shared_prop as sp with (nolock)
			where
				sp.pacs_prop_id = psa.prop_id
			and	sp.shared_year = psa.owner_tax_yr
			and	sp.sup_num = psa.sup_num
		)
		and	not exists
		(
			select
				*
			from
				appr_notice_prop_list as anpl with (nolock)
			where
				anpl.prop_id = psa.prop_id
			and	anpl.owner_id = o.owner_id
			and	anpl.notice_owner_id = o.owner_id
			and	anpl.sup_yr = psa.owner_tax_yr
			and	anpl.sup_num = psa.sup_num
			and	anpl.notice_yr = @input_notice_yr
			and	anpl.notice_num = @input_notice_num
		)
	end
	/* select shared based on selection criteria */
	else if (@shared_prop_option = 'S')
	begin
		if (@use_rend_19a = 'T')
		begin
			if(@rend_19a_option = 'A')
			begin
				insert into
					appr_notice_prop_list
				(
					notice_yr, 
					notice_num,  
					prop_id,     
					owner_id,    
					notice_owner_id,    
					sup_num,     
					sup_yr,
					special_group_id,
					rend_19a
				)
				select
					@input_notice_yr,
					@input_notice_num,
					psa.prop_id,
					o.owner_id,
					o.owner_id,
					psa.sup_num,
					psa.owner_tax_yr,
					@input_special_group_id,
					'T'
				from
					special_group_prop_assoc as sgpa with (nolock)
				inner join
					special_group as sg with (nolock)
				on
					sg.special_group_id = sgpa.special_group_id
				inner join
					property as p with (nolock)
				on
					p.prop_id = sgpa.prop_id
				inner join
					prop_supp_assoc as psa with (nolock)
				on
					psa.prop_id = sgpa.prop_id
				and	psa.owner_tax_yr = sgpa.prop_val_yr
				inner join
					property_val as pv with (nolock)
				on
					pv.prop_id = psa.prop_id
				and	pv.prop_val_yr = psa.owner_tax_yr
				and	pv.sup_num = psa.sup_num
				and	pv.prop_inactive_dt is null
				and	pv.rendered_yr = pv.prop_val_yr
				inner join
					owner as o with (nolock)
				on
					o.prop_id = pv.prop_id
				and	o.owner_tax_yr = pv.prop_val_yr
				and	o.sup_num = pv.sup_num
				where
					sgpa.special_group_id = @input_special_group_id
				and	sgpa.prop_val_yr = @input_notice_yr
				and	exists
				(
					select
						*
					from
						shared_prop as sp with (nolock)
					where
						sp.pacs_prop_id = psa.prop_id
					and	sp.shared_year = psa.owner_tax_yr
					and	sp.sup_num = psa.sup_num
				)
				and	not exists
				(
					select
						*
					from
						appr_notice_prop_list as anpl with (nolock)
					where
						anpl.prop_id = psa.prop_id
					and	anpl.owner_id = o.owner_id
					and	anpl.notice_owner_id = o.owner_id
					and	anpl.sup_yr = psa.owner_tax_yr
					and	anpl.sup_num = psa.sup_num
					and	anpl.notice_yr = @input_notice_yr
					and	anpl.notice_num = @input_notice_num
				)

				union

				select
					@input_notice_yr,
					@input_notice_num,
					psa.prop_id,
					o.owner_id,
					o.owner_id,
					psa.sup_num,
					psa.owner_tax_yr,
					@input_special_group_id,
					'T'
				from
					special_group_owner_assoc as sgoa with (nolock)
				inner join
					special_group as sg with (nolock)
				on
					sg.special_group_id = sgoa.special_group_id
				inner join
					owner as o with (nolock)
				on
					o.owner_id = sgoa.owner_id
				and	o.owner_tax_yr = sgoa.owner_tax_yr
				inner join
					property as p with (nolock)
				on
					p.prop_id = o.prop_id
				inner join
					prop_supp_assoc as psa with (nolock)
				on
					psa.prop_id = o.prop_id
				and	psa.owner_tax_yr = o.owner_tax_yr
				and	psa.sup_num = o.sup_num
				inner join
					property_val as pv with (nolock)
				on
					pv.prop_id = psa.prop_id
				and	pv.prop_val_yr = psa.owner_tax_yr
				and	pv.sup_num = psa.sup_num
				and	pv.prop_inactive_dt is null
				and	pv.rendered_yr = pv.prop_val_yr
				where
					sgoa.special_group_id = @input_special_group_id
				and	sgoa.owner_tax_yr = @input_notice_yr
				and	exists
				(
					select
						*
					from
						shared_prop as sp with (nolock)
					where
						sp.pacs_prop_id = psa.prop_id
					and	sp.shared_year = psa.owner_tax_yr
					and	sp.sup_num = psa.sup_num
				)
				and	not exists
				(
					select
						*
					from
						appr_notice_prop_list as anpl with (nolock)
					where
						anpl.prop_id = psa.prop_id
					and	anpl.owner_id = o.owner_id
					and	anpl.notice_owner_id = o.owner_id
					and	anpl.sup_yr = psa.owner_tax_yr
					and	anpl.sup_num = psa.sup_num
					and	anpl.notice_yr = @input_notice_yr
					and	anpl.notice_num = @input_notice_num
				)
			end
			else
			begin
				insert into
					appr_notice_prop_list
				(
					notice_yr, 
					notice_num,  
					prop_id,     
					owner_id,    
					notice_owner_id,    
					sup_num,     
					sup_yr,
					special_group_id,
					rend_19a_ar
				)
				select
					@input_notice_yr,
					@input_notice_num,
					psa.prop_id,
					o.owner_id,
					o.owner_id,
					psa.sup_num,
					psa.owner_tax_yr,
					@input_special_group_id,
					'T'
				from
					special_group_prop_assoc as sgpa with (nolock)
				inner join
					special_group as sg with (nolock)
				on
					sg.special_group_id = sgpa.special_group_id
				inner join
					property as p with (nolock)
				on
					p.prop_id = sgpa.prop_id
				inner join
					prop_supp_assoc as psa with (nolock)
				on
					psa.prop_id = sgpa.prop_id
				and	psa.owner_tax_yr = sgpa.prop_val_yr
				inner join
					property_val as pv with (nolock)
				on
					pv.prop_id = psa.prop_id
				and	pv.prop_val_yr = psa.owner_tax_yr
				and	pv.sup_num = psa.sup_num
				and	pv.prop_inactive_dt is null
				and	pv.rendered_yr = pv.prop_val_yr
				and	pv.assessed_val > pv.rendered_val
				inner join
					owner as o with (nolock)
				on
					o.prop_id = pv.prop_id
				and	o.owner_tax_yr = pv.prop_val_yr
				and	o.sup_num = pv.sup_num
				where
					sgpa.special_group_id = @input_special_group_id
				and	sgpa.prop_val_yr = @input_notice_yr
				and	exists
				(
					select
						*
					from
						shared_prop as sp with (nolock)
					where
						sp.pacs_prop_id = psa.prop_id
					and	sp.shared_year = psa.owner_tax_yr
					and	sp.sup_num = psa.sup_num
				)
				and	not exists
				(
					select
						*
					from
						appr_notice_prop_list as anpl with (nolock)
					where
						anpl.prop_id = psa.prop_id
					and	anpl.owner_id = o.owner_id
					and	anpl.notice_owner_id = o.owner_id
					and	anpl.sup_yr = psa.owner_tax_yr
					and	anpl.sup_num = psa.sup_num
					and	anpl.notice_yr = @input_notice_yr
					and	anpl.notice_num = @input_notice_num
				)

				union

				select
					@input_notice_yr,
					@input_notice_num,
					psa.prop_id,
					o.owner_id,
					o.owner_id,
					psa.sup_num,
					psa.owner_tax_yr,
					@input_special_group_id,
					'T'
				from
					special_group_owner_assoc as sgoa with (nolock)
				inner join
					special_group as sg with (nolock)
				on
					sg.special_group_id = sgoa.special_group_id
				inner join
					owner as o with (nolock)
				on
					o.owner_id = sgoa.owner_id
				and	o.owner_tax_yr = sgoa.owner_tax_yr
				inner join
					property as p with (nolock)
				on
					p.prop_id = o.prop_id
				inner join
					prop_supp_assoc as psa with (nolock)
				on
					psa.prop_id = o.prop_id
				and	psa.owner_tax_yr = o.owner_tax_yr
				and	psa.sup_num = o.sup_num
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
					sgoa.special_group_id = @input_special_group_id
				and	sgoa.owner_tax_yr = @input_notice_yr
				and	exists
				(
					select
						*
					from
						shared_prop as sp with (nolock)
					where
						sp.pacs_prop_id = psa.prop_id
					and	sp.shared_year = psa.owner_tax_yr
					and	sp.sup_num = psa.sup_num
				)
				and	not exists
				(
					select
						*
					from
						appr_notice_prop_list as anpl with (nolock)
					where
						anpl.prop_id = psa.prop_id
					and	anpl.owner_id = o.owner_id
					and	anpl.notice_owner_id = o.owner_id
					and	anpl.sup_yr = psa.owner_tax_yr
					and	anpl.sup_num = psa.sup_num
					and	anpl.notice_yr = @input_notice_yr
					and	anpl.notice_num = @input_notice_num
				)
			end
		end
			

		if (@use_group_codes_list = 'T')
		begin
			insert into
				appr_notice_prop_list_group_code
			(
				notice_yr,
				notice_num,
				prop_id,
				prop_group_cd,
				special_group_id
			)
			select
				@input_notice_yr,
				@input_notice_num,
				pga.prop_id,
				pga.prop_group_cd,
				@input_special_group_id
			from
				appr_notice_selection_criteria_group_codes as anscgc with (nolock)
			inner join
				special_group_prop_assoc as sgpa with (nolock)
			on
				sgpa.special_group_id = @input_special_group_id
			and	sgpa.prop_val_yr = anscgc.notice_yr
			inner join
				special_group as sg with (nolock)
			on
				sg.special_group_id = sgpa.special_group_id
			inner join
				property as p with (nolock)
			on
				p.prop_id = sgpa.prop_id
			inner join
				prop_group_assoc as pga with (nolock)
			on
				pga.prop_id = p.prop_id
			and	pga.prop_group_cd = anscgc.group_cd
			inner join
				prop_supp_assoc as psa with (nolock)
			on
				psa.prop_id = sgpa.prop_id
			and	psa.owner_tax_yr = sgpa.prop_val_yr 
			inner join
				property_val as pv with (nolock)
			on
				pv.prop_id = psa.prop_id
			and	pv.prop_val_yr = psa.owner_tax_yr
			and	pv.sup_num = psa.sup_num
			and	pv.prop_inactive_dt is null
			where
				anscgc.notice_yr = @input_notice_yr
			and	anscgc.notice_num = @input_notice_num
			and	exists
			(
				select
					*
				from
					shared_prop as sp with (nolock)
				where
					sp.pacs_prop_id = psa.prop_id
				and	sp.shared_year = psa.owner_tax_yr
				and	sp.sup_num = psa.sup_num
			)
			and	not exists
			(
				select
					*
				from
					appr_notice_prop_list_group_code as anplgc with (nolock)
				where
					anplgc.notice_yr = @input_notice_yr
				and	anplgc.notice_num = @input_notice_num
				and	anplgc.prop_id = pga.prop_id
				and	anplgc.prop_group_cd = pga.prop_group_cd
			)

			union

			select
				@input_notice_yr,
				@input_notice_num,
				pga.prop_id,
				pga.prop_group_cd,
				@input_special_group_id
			from
				appr_notice_selection_criteria_group_codes as anscgc with (nolock)
			inner join
				special_group_owner_assoc as sgoa with (nolock)
			on
				sgoa.special_group_id = @input_special_group_id
			and	sgoa.owner_tax_yr = anscgc.notice_yr
			inner join
				special_group as sg with (nolock)
			on
				sg.special_group_id = sgoa.special_group_id
			inner join
				owner as o with (nolock)
			on
				o.owner_id = sgoa.owner_id
			and	o.owner_tax_yr = sgoa.owner_tax_yr
			inner join
				property as p with (nolock)
			on
				p.prop_id = o.prop_id
			inner join
				prop_group_assoc as pga with (nolock)
			on
				pga.prop_id = p.prop_id
			and	pga.prop_group_cd = anscgc.group_cd
			inner join
				prop_supp_assoc as psa with (nolock)
			on
				psa.prop_id = o.prop_id
			and	psa.owner_tax_yr = o.owner_tax_yr
			inner join
				property_val as pv with (nolock)
			on
				pv.prop_id = psa.prop_id
			and	pv.prop_val_yr = psa.owner_tax_yr
			and	pv.sup_num = psa.sup_num
			and	pv.prop_inactive_dt is null
			where
				anscgc.notice_yr = @input_notice_yr
			and	anscgc.notice_num = @input_notice_num
			and	exists
			(
				select
					*
				from
					shared_prop as sp with (nolock)
				where
					sp.pacs_prop_id = psa.prop_id
				and	sp.shared_year = psa.owner_tax_yr
				and	sp.sup_num = psa.sup_num
			)
			and	not exists
			(
				select
					*
				from
					appr_notice_prop_list_group_code as anplgc with (nolock)
				where
					anplgc.notice_yr = @input_notice_yr
				and	anplgc.notice_num = @input_notice_num
				and	anplgc.prop_id = pga.prop_id
				and	anplgc.prop_group_cd = pga.prop_group_cd
			)


			insert into
				appr_notice_prop_list
			(
				notice_yr, 
				notice_num,  
				prop_id,     
				owner_id,    
				notice_owner_id,    
				sup_num,     
				sup_yr,
				special_group_id,
				code_list
			)
			select
				anplgc.notice_yr,
				anplgc.notice_num,
				psa.prop_id,
				o.owner_id,
				o.owner_id,
				psa.sup_num,
				psa.owner_tax_yr,
				anplgc.special_group_id,
				'T'
			from
				appr_notice_prop_list_group_code as anplgc with (nolock)
			inner join
				property as p with (nolock)
			on
				p.prop_id = anplgc.prop_id
			inner join
				prop_supp_assoc as psa with (nolock)
			on
				psa.prop_id = anplgc.prop_id
			and	psa.owner_tax_yr = anplgc.notice_yr
			inner join
				owner as o with (nolock)
			on
				o.prop_id = psa.prop_id
			and	o.owner_tax_yr = psa.owner_tax_yr
			and	o.sup_num = psa.sup_num
			where
				anplgc.notice_yr = @input_notice_yr
			and	anplgc.notice_num = @input_notice_num
			and	anplgc.special_group_id = @input_special_group_id
			and	not exists
			(
				select
					*
				from
					appr_notice_prop_list as anpl with (nolock)
				where
					anpl.notice_yr = @input_notice_yr
				and	anpl.notice_num = @input_notice_num
				and	anpl.prop_id = psa.prop_id
				and	anpl.sup_yr = psa.owner_tax_yr
				and	anpl.sup_num = psa.sup_num
				and	anpl.owner_id = o.owner_id
				and	anpl.notice_owner_id = o.owner_id
			)
			group by
				anplgc.notice_yr,
				anplgc.notice_num,
				psa.prop_id,
				o.owner_id,
				o.owner_id,
				psa.sup_num,
				psa.owner_tax_yr,
				anplgc.special_group_id
		end			
		
		if (@use_value_decr_less_19a = 'T')
		begin
			if (@use_assessed = 'T')
			begin
				insert into
					appr_notice_prop_list
				(
					notice_yr, 
					notice_num,  
					prop_id,     
					owner_id,    
					notice_owner_id,    
					sup_num,     
					sup_yr,
					special_group_id,  
					value_decr_19a
				)
				select
					@input_notice_yr,
					@input_notice_num,
					cppvv.prop_id,
					cppvv.owner_id,
					cppvv.owner_id,
					cppvv.sup_num,
					cppvv.owner_tax_yr,
					@input_special_group_id,
					'T'
				from
					special_group_prop_assoc as sgpa with (nolock)
				inner join
					special_group as sg with (nolock)
				on
					sg.special_group_id = sgpa.special_group_id
				inner join
					curr_prop_prev_value_vw as cppvv with (nolock)
				on
					cppvv.prop_id = sgpa.prop_id
				and	cppvv.owner_tax_yr = sgpa.prop_val_yr
				and	(cppvv.assessed_val - cppvv.prev_assessed) < 0
				and	((cppvv.assessed_val - cppvv.prev_assessed) * -1) >= @decr_amt_19a
				where
					sgpa.special_group_id = @input_special_group_id
				and	sgpa.prop_val_yr = @input_notice_yr
				and	exists
				(
					select
						*
					from
						shared_prop as sp with (nolock)
					where
						sp.pacs_prop_id = cppvv.prop_id
					and	sp.shared_year = cppvv.owner_tax_yr
					and	sp.sup_num = cppvv.sup_num
				)
				and	not exists
				(
					select
						*
					from
						appr_notice_prop_list as anpl with (nolock)
					where
						anpl.prop_id = cppvv.prop_id
					and	anpl.owner_id = cppvv.owner_id
					and	anpl.notice_owner_id = cppvv.owner_id
					and	anpl.sup_yr = cppvv.owner_tax_yr
					and	anpl.sup_num = cppvv.sup_num
					and	anpl.notice_yr = @input_notice_yr
					and	anpl.notice_num = @input_notice_num
				)
				
				union
		
				select
					@input_notice_yr,
					@input_notice_num,
					cppvv.prop_id,
					cppvv.owner_id,
					cppvv.owner_id,
					cppvv.sup_num,
					cppvv.owner_tax_yr,
					@input_special_group_id,
					'T'
				from
					special_group_owner_assoc as sgoa with (nolock)
				inner join
					special_group as sg with (nolock)
				on
					sg.special_group_id = sgoa.special_group_id
				inner join
					curr_prop_prev_value_vw as cppvv with (nolock)
				on
					cppvv.owner_id = sgoa.owner_id
				and	cppvv.owner_tax_yr = sgoa.owner_tax_yr
				and	(cppvv.assessed_val - cppvv.prev_assessed) < 0
				and	((cppvv.assessed_val - cppvv.prev_assessed) * -1) >= @decr_amt_19a
				where
					sgoa.special_group_id = @input_special_group_id
				and	sgoa.owner_tax_yr = @input_notice_yr
				and	exists
				(
					select
						*
					from
						shared_prop as sp with (nolock)
					where
						sp.pacs_prop_id = cppvv.prop_id
					and	sp.shared_year = cppvv.owner_tax_yr
					and	sp.sup_num = cppvv.sup_num
				)
				and	not exists
				(
					select
						*
					from
						appr_notice_prop_list as anpl with (nolock)
					where
						anpl.prop_id = cppvv.prop_id
					and	anpl.owner_id = cppvv.owner_id
					and	anpl.notice_owner_id = cppvv.owner_id
					and	anpl.sup_yr = cppvv.owner_tax_yr
					and	anpl.sup_num = cppvv.sup_num
					and	anpl.notice_yr = @input_notice_yr
					and	anpl.notice_num = @input_notice_num
				)
			end
				
			if (@use_market	 = 'T')
			begin
				insert into
					appr_notice_prop_list
				(
					notice_yr, 
					notice_num,  
					prop_id,     
					owner_id,    
					notice_owner_id,    
					sup_num,     
					sup_yr,
					special_group_id,  
					value_decr_19a
				)
				select
					@input_notice_yr,
					@input_notice_num,
					cppvv.prop_id,
					cppvv.owner_id,
					cppvv.owner_id,
					cppvv.sup_num,
					cppvv.owner_tax_yr,
					@input_special_group_id,
					'T'
				from
					special_group_prop_assoc as sgpa with (nolock)
				inner join
					special_group as sg with (nolock)
				on
					sg.special_group_id = sgpa.special_group_id
				inner join
					curr_prop_prev_value_vw as cppvv with (nolock)
				on
					cppvv.prop_id = sgpa.prop_id
				and	cppvv.owner_tax_yr = sgpa.prop_val_yr
				and	(cppvv.market - cppvv.prev_market) < 0
				and	((cppvv.market - cppvv.prev_market) * -1) >= @decr_amt_19a
				where
					sgpa.special_group_id = @input_special_group_id
				and	sgpa.prop_val_yr = @input_notice_yr
				and	exists
				(
					select
						*
					from
						shared_prop as sp with (nolock)
					where
						sp.pacs_prop_id = cppvv.prop_id
					and	sp.shared_year = cppvv.owner_tax_yr
					and	sp.sup_num = cppvv.sup_num
				)
				and	not exists
				(
					select
						*
					from
						appr_notice_prop_list as anpl with (nolock)
					where
						anpl.prop_id = cppvv.prop_id
					and	anpl.owner_id = cppvv.owner_id
					and	anpl.notice_owner_id = cppvv.owner_id
					and	anpl.sup_yr = cppvv.owner_tax_yr
					and	anpl.sup_num = cppvv.sup_num
					and	anpl.notice_yr = @input_notice_yr
					and	anpl.notice_num = @input_notice_num
				)
				
				union
		
				select
					@input_notice_yr,
					@input_notice_num,
					cppvv.prop_id,
					cppvv.owner_id,
					cppvv.owner_id,
					cppvv.sup_num,
					cppvv.owner_tax_yr,
					@input_special_group_id,
					'T'
				from
					special_group_owner_assoc as sgoa with (nolock)
				inner join
					special_group as sg with (nolock)
				on
					sg.special_group_id = sgoa.special_group_id
				inner join
					curr_prop_prev_value_vw as cppvv with (nolock)
				on
					cppvv.owner_id = sgoa.owner_id
				and	cppvv.owner_tax_yr = sgoa.owner_tax_yr
				and	(cppvv.market - cppvv.prev_market) < 0
				and	((cppvv.market - cppvv.prev_market) * -1) >= @decr_amt_19a
				where
					sgoa.special_group_id = @input_special_group_id
				and	sgoa.owner_tax_yr = @input_notice_yr
				and	exists
				(
					select
						*
					from
						shared_prop as sp with (nolock)
					where
						sp.pacs_prop_id = cppvv.prop_id
					and	sp.shared_year = cppvv.owner_tax_yr
					and	sp.sup_num = cppvv.sup_num
				)
				and	not exists
				(
					select
						*
					from
						appr_notice_prop_list as anpl with (nolock)
					where
						anpl.prop_id = cppvv.prop_id
					and	anpl.owner_id = cppvv.owner_id
					and	anpl.notice_owner_id = cppvv.owner_id
					and	anpl.sup_yr = cppvv.owner_tax_yr
					and	anpl.sup_num = cppvv.sup_num
					and	anpl.notice_yr = @input_notice_yr
					and	anpl.notice_num = @input_notice_num
				)
			end
		end


		if (@use_value_inc_greater_19a = 'T')
		begin
			if (@use_assessed = 'T')
			begin
				insert into
					appr_notice_prop_list
				(
					notice_yr, 
					notice_num,  
					prop_id,     
					owner_id,    
					notice_owner_id,    
					sup_num,     
					sup_yr,  
					special_group_id,
					value_inc_19a
				)
				select
					@input_notice_yr,
					@input_notice_num,
					cppvv.prop_id,
					cppvv.owner_id,
					cppvv.owner_id,
					cppvv.sup_num,
					cppvv.owner_tax_yr,
					@input_special_group_id,
					'T'
				from
					special_group_prop_assoc as sgpa with (nolock)
				inner join
					special_group as sg with (nolock)
				on
					sg.special_group_id = sgpa.special_group_id
				inner join
					curr_prop_prev_value_vw as cppvv with (nolock)
				on
					cppvv.prop_id = sgpa.prop_id
				and	cppvv.owner_tax_yr = sgpa.prop_val_yr
				and	(cppvv.assessed_val - cppvv.prev_assessed) >= @inc_amt_19a
				where
					sgpa.special_group_id = @input_special_group_id
				and	sgpa.prop_val_yr = @input_notice_yr
				and	exists
				(
					select
						*
					from
						shared_prop as sp with (nolock)
					where
						sp.pacs_prop_id = cppvv.prop_id
					and	sp.shared_year = cppvv.owner_tax_yr
					and	sp.sup_num = cppvv.sup_num
				)
				and	not exists
				(
					select
						*
					from
						appr_notice_prop_list as anpl with (nolock)
					where
						anpl.prop_id = cppvv.prop_id
					and	anpl.owner_id = cppvv.owner_id
					and	anpl.notice_owner_id = cppvv.owner_id
					and	anpl.sup_yr = cppvv.owner_tax_yr
					and	anpl.sup_num = cppvv.sup_num
					and	anpl.notice_yr = @input_notice_yr
					and	anpl.notice_num = @input_notice_num
				)
				
				union
		
				select
					@input_notice_yr,
					@input_notice_num,
					cppvv.prop_id,
					cppvv.owner_id,
					cppvv.owner_id,
					cppvv.sup_num,
					cppvv.owner_tax_yr,
					@input_special_group_id,
					'T'
				from
					special_group_owner_assoc as sgoa with (nolock)
				inner join
					special_group as sg with (nolock)
				on
					sg.special_group_id = sgoa.special_group_id
				inner join
					curr_prop_prev_value_vw as cppvv with (nolock)
				on
					cppvv.owner_id = sgoa.owner_id
				and	cppvv.owner_tax_yr = sgoa.owner_tax_yr
				and	(cppvv.assessed_val - cppvv.prev_assessed) >= @inc_amt_19a
				where
					sgoa.special_group_id = @input_special_group_id
				and	sgoa.owner_tax_yr = @input_notice_yr
				and	exists
				(
					select
						*
					from
						shared_prop as sp with (nolock)
					where
						sp.pacs_prop_id = cppvv.prop_id
					and	sp.shared_year = cppvv.owner_tax_yr
					and	sp.sup_num = cppvv.sup_num
				)
				and	not exists
				(
					select
						*
					from
						appr_notice_prop_list as anpl with (nolock)
					where
						anpl.prop_id = cppvv.prop_id
					and	anpl.owner_id = cppvv.owner_id
					and	anpl.notice_owner_id = cppvv.owner_id
					and	anpl.sup_yr = cppvv.owner_tax_yr
					and	anpl.sup_num = cppvv.sup_num
					and	anpl.notice_yr = @input_notice_yr
					and	anpl.notice_num = @input_notice_num
				)
			end
			
			if (@use_market	= 'T')
			begin
				insert into
					appr_notice_prop_list
				(
					notice_yr, 
					notice_num,  
					prop_id,     
					owner_id,    
					notice_owner_id,    
					sup_num,     
					sup_yr,
					special_group_id,
					value_inc_19a
				)
				select
					@input_notice_yr,
					@input_notice_num,
					cppvv.prop_id,
					cppvv.owner_id,
					cppvv.owner_id,
					cppvv.sup_num,
					cppvv.owner_tax_yr,
					@input_special_group_id,
					'T'
				from
					special_group_prop_assoc as sgpa with (nolock)
				inner join
					special_group as sg with (nolock)
				on
					sg.special_group_id = sgpa.special_group_id
				inner join
					curr_prop_prev_value_vw as cppvv with (nolock)
				on
					cppvv.prop_id = sgpa.prop_id
				and	cppvv.owner_tax_yr = sgpa.prop_val_yr
				and	(cppvv.market - cppvv.prev_market) >= @inc_amt_19a
				where
					sgpa.special_group_id = @input_special_group_id
				and	sgpa.prop_val_yr = @input_notice_yr
				and	exists
				(
					select
						*
					from
						shared_prop as sp with (nolock)
					where
						sp.pacs_prop_id = cppvv.prop_id
					and	sp.shared_year = cppvv.owner_tax_yr
					and	sp.sup_num = cppvv.sup_num
				)
				and	not exists
				(
					select
						*
					from
						appr_notice_prop_list as anpl with (nolock)
					where
						anpl.prop_id = cppvv.prop_id
					and	anpl.owner_id = cppvv.owner_id
					and	anpl.notice_owner_id = cppvv.owner_id
					and	anpl.sup_yr = cppvv.owner_tax_yr
					and	anpl.sup_num = cppvv.sup_num
					and	anpl.notice_yr = @input_notice_yr
					and	anpl.notice_num = @input_notice_num
				)
				
				union
		
				select
					@input_notice_yr,
					@input_notice_num,
					cppvv.prop_id,
					cppvv.owner_id,
					cppvv.owner_id,
					cppvv.sup_num,
					cppvv.owner_tax_yr,
					@input_special_group_id,
					'T'
				from
					special_group_owner_assoc as sgoa with (nolock)
				inner join
					special_group as sg with (nolock)
				on
					sg.special_group_id = sgoa.special_group_id
				inner join
					curr_prop_prev_value_vw as cppvv with (nolock)
				on
					cppvv.owner_id = sgoa.owner_id
				and	cppvv.owner_tax_yr = sgoa.owner_tax_yr
				and	(cppvv.market - cppvv.prev_market) >= @inc_amt_19a
				where
					sgoa.special_group_id = @input_special_group_id
				and	sgoa.owner_tax_yr = @input_notice_yr
				and	exists
				(
					select
						*
					from
						shared_prop as sp with (nolock)
					where
						sp.pacs_prop_id = cppvv.prop_id
					and	sp.shared_year = cppvv.owner_tax_yr
					and	sp.sup_num = cppvv.sup_num
				)
				and	not exists
				(
					select
						*
					from
						appr_notice_prop_list as anpl with (nolock)
					where
						anpl.prop_id = cppvv.prop_id
					and	anpl.owner_id = cppvv.owner_id
					and	anpl.notice_owner_id = cppvv.owner_id
					and	anpl.sup_yr = cppvv.owner_tax_yr
					and	anpl.sup_num = cppvv.sup_num
					and	anpl.notice_yr = @input_notice_yr
					and	anpl.notice_num = @input_notice_num
				)
			end
		
		end

		if (@use_new_prop_19a = 'T')
		begin
			insert into appr_notice_prop_list
			(
				notice_yr, 
				notice_num,  
				prop_id,     
				owner_id,    
				notice_owner_id,    
				sup_num,     
				sup_yr,
				special_group_id, 
				value_new_prop_19a
			)
			select
				@input_notice_yr,
				@input_notice_num,
				psa.prop_id,
				o.owner_id,
				o.owner_id,
				psa.sup_num,
				psa.owner_tax_yr,
				@input_special_group_id,
				'T'
			from
				special_group_prop_assoc as sgpa with (nolock)
			inner join
				special_group as sg with (nolock)
			on
				sg.special_group_id = sgpa.special_group_id
			inner join
				property as p with (nolock)
			on
				p.prop_id = sgpa.prop_id
			inner join
				prop_supp_assoc as psa with (nolock)
			on
				psa.prop_id = sgpa.prop_id
			and	psa.owner_tax_yr = sgpa.prop_val_yr
			inner join
				property_val as pv with (nolock)
			on
				pv.prop_id = psa.prop_id
			and	pv.prop_val_yr = psa.owner_tax_yr
			and	pv.sup_num = psa.sup_num
			and	pv.prop_inactive_dt is null
			inner join
				owner as o with (nolock)
			on
				o.prop_id = pv.prop_id
			and	o.owner_tax_yr = pv.prop_val_yr
			and	o.sup_num = pv.sup_num
			where
				sgpa.special_group_id = @input_special_group_id
			and	sgpa.prop_val_yr = @input_notice_yr
			and	not exists
			(
				select
					*
				from
					prop_supp_assoc as psa1 with (nolock)
				inner join
					property_val as pv1 with (nolock)
				on
					pv1.prop_id = psa1.prop_id
				and	pv1.prop_val_yr = psa1.owner_tax_yr
				and	pv1.sup_num = psa1.sup_num
				where
					psa1.prop_id = psa.prop_id
				and	psa1.owner_tax_yr = (psa.owner_tax_yr - 1)
			)
			and	exists
			(
				select
					*
				from
					shared_prop as sp with (nolock)
				where
					sp.pacs_prop_id = psa.prop_id
				and	sp.shared_year = psa.owner_tax_yr
				and	sp.sup_num = psa.sup_num
			)
			and	not exists
			(
				select
					*
				from
					appr_notice_prop_list as anpl with (nolock)
				where
					anpl.prop_id = psa.prop_id
				and	anpl.owner_id = o.owner_id
				and	anpl.notice_owner_id = o.owner_id
				and	anpl.sup_yr = psa.owner_tax_yr
				and	anpl.sup_num = psa.sup_num
				and	anpl.notice_yr = @input_notice_yr
				and	anpl.notice_num = @input_notice_num
			)
			
			union
	
			select
				@input_notice_yr,
				@input_notice_num,
				psa.prop_id,
				o.owner_id,
				o.owner_id,
				psa.sup_num,
				psa.owner_tax_yr,
				@input_special_group_id,
				'T'
			from
				special_group_owner_assoc as sgoa with (nolock)
			inner join
				special_group as sg with (nolock)
			on
				sg.special_group_id = sgoa.special_group_id
			inner join
				owner as o with (nolock)
			on
				o.owner_id = sgoa.owner_id
			and	o.owner_tax_yr = sgoa.owner_tax_yr
			inner join
				property as p with (nolock)
			on
				p.prop_id = o.prop_id
			inner join
				prop_supp_assoc as psa with (nolock)
			on
				psa.prop_id = o.prop_id
			and	psa.owner_tax_yr = o.owner_tax_yr
			and	psa.sup_num = o.sup_num
			inner join
				property_val as pv with (nolock)
			on
				pv.prop_id = psa.prop_id
			and	pv.prop_val_yr = psa.owner_tax_yr
			and	pv.sup_num = psa.sup_num
			and	pv.prop_inactive_dt is null
			where
				sgoa.special_group_id = @input_special_group_id
			and	sgoa.owner_tax_yr = @input_notice_yr
			and	not exists
			(
				select
					*
				from
					prop_supp_assoc as psa1 with (nolock)
				inner join
					property_val as pv1 with (nolock)
				on
					pv1.prop_id = psa1.prop_id
				and	pv1.prop_val_yr = psa1.owner_tax_yr
				and	pv1.sup_num = psa1.sup_num
				where
					psa1.prop_id = psa.prop_id
				and	psa1.owner_tax_yr = (psa.owner_tax_yr - 1)
			)
			and	exists
			(
				select
					*
				from
					shared_prop as sp with (nolock)
				where
					sp.pacs_prop_id = psa.prop_id
				and	sp.shared_year = psa.owner_tax_yr
				and	sp.sup_num = psa.sup_num
			)
			and	not exists
			(
				select
					*
				from
					appr_notice_prop_list as anpl with (nolock)
				where
					anpl.prop_id = psa.prop_id
				and	anpl.owner_id = o.owner_id
				and	anpl.notice_owner_id = o.owner_id
				and	anpl.sup_yr = psa.owner_tax_yr
				and	anpl.sup_num = psa.sup_num
				and	anpl.notice_yr = @input_notice_yr
				and	anpl.notice_num = @input_notice_num
			)
		end

		if (@use_last_owner_change_19i = 'T')
		begin
			insert into appr_notice_prop_list
			(
				notice_yr, 
				notice_num,  
				prop_id,     
				owner_id,
				notice_owner_id,
				sup_num,     
				sup_yr, 
				special_group_id, 
				last_owner_change_19i
			)
			select distinct
               			@input_notice_yr,
		       		@input_notice_num,
		       		psa.prop_id,
		       		o.owner_id,
		       		o.owner_id,
		       		psa.sup_num,
		       		psa.owner_tax_yr,
				@input_special_group_id,
		       		'T'
			from
				special_group_prop_assoc as sgpa with (nolock)
			inner join
				special_group as sg with (nolock)
			on
				sg.special_group_id = sgpa.special_group_id
			inner join
				property as p with (nolock)
			on
				p.prop_id = sgpa.prop_id
			inner join
				prop_supp_assoc as psa with (nolock)
			on
				psa.prop_id = sgpa.prop_id
			and	psa.owner_tax_yr = sgpa.prop_val_yr
			inner join
				chg_of_owner_prop_assoc as coopa with (nolock)
			on
				coopa.prop_id = psa.prop_id
			inner join
				chg_of_owner as coo with (nolock)
			on
				coo.chg_of_owner_id = coopa.chg_of_owner_id
			and	coo.deed_dt >= @last_owner_change_date_19i
			inner join
				property_val as pv with (nolock)
			on
				pv.prop_id = psa.prop_id
			and	pv.prop_val_yr = psa.owner_tax_yr
			and	pv.sup_num = psa.sup_num
			and	pv.prop_inactive_dt is null
			inner join
				owner as o with (nolock)
			on
				o.prop_id = pv.prop_id
			and	o.owner_tax_yr = pv.prop_val_yr
			and	o.sup_num = pv.sup_num
			where
				sgpa.special_group_id = @input_special_group_id
			and	sgpa.prop_val_yr = @input_notice_yr
			and	exists
			(
				select
					*
				from
					shared_prop as sp with (nolock)
				where
					sp.pacs_prop_id = psa.prop_id
				and	sp.shared_year = psa.owner_tax_yr
				and	sp.sup_num = psa.sup_num
			)
			and	not exists
			(
				select
					*
				from
					appr_notice_prop_list as anpl with (nolock)
				where
					anpl.prop_id = psa.prop_id
				and	anpl.owner_id = o.owner_id
				and	anpl.notice_owner_id = o.owner_id
				and	anpl.sup_yr = psa.owner_tax_yr
				and	anpl.sup_num = psa.sup_num
				and	anpl.notice_yr = @input_notice_yr
				and	anpl.notice_num = @input_notice_num
			)

			union

			select distinct
               			@input_notice_yr,
		       		@input_notice_num,
		       		psa.prop_id,
		       		o.owner_id,
		       		o.owner_id,
		       		psa.sup_num,
		       		psa.owner_tax_yr,
				@input_special_group_id,
		       		'T'
			from
				special_group_owner_assoc as sgoa with (nolock)
			inner join
				special_group as sg with (nolock)
			on
				sg.special_group_id = sgoa.special_group_id
			inner join
				owner as o with (nolock)
			on
				o.owner_id = sgoa.owner_id
			and	o.owner_tax_yr = sgoa.owner_tax_yr
			inner join
				property as p with (nolock)
			on
				p.prop_id = o.prop_id
			inner join
				prop_supp_assoc as psa with (nolock)
			on
				psa.prop_id = o.prop_id
			and	psa.owner_tax_yr = o.owner_tax_yr
			and	psa.sup_num = o.sup_num
			inner join
				chg_of_owner_prop_assoc as coopa with (nolock)
			on
				coopa.prop_id = psa.prop_id
			inner join
				chg_of_owner as coo with (nolock)
			on
				coo.chg_of_owner_id = coopa.chg_of_owner_id
			and	coo.deed_dt >= @last_owner_change_date_19i
			inner join
				property_val as pv with (nolock)
			on
				pv.prop_id = psa.prop_id
			and	pv.prop_val_yr = psa.owner_tax_yr
			and	pv.sup_num = psa.sup_num
			and	pv.prop_inactive_dt is null
			where
				sgoa.special_group_id = @input_special_group_id
			and	sgoa.owner_tax_yr = @input_notice_yr
			and	exists
			(
				select
					*
				from
					shared_prop as sp with (nolock)
				where
					sp.pacs_prop_id = psa.prop_id
				and	sp.shared_year = psa.owner_tax_yr
				and	sp.sup_num = psa.sup_num
			)
			and	not exists
			(
				select
					*
				from
					appr_notice_prop_list as anpl with (nolock)
				where
					anpl.prop_id = psa.prop_id
				and	anpl.owner_id = o.owner_id
				and	anpl.notice_owner_id = o.owner_id
				and	anpl.sup_yr = psa.owner_tax_yr
				and	anpl.sup_num = psa.sup_num
				and	anpl.notice_yr = @input_notice_yr
				and	anpl.notice_num = @input_notice_num
			)
		end

		if (@use_last_appr_year_19i = 'T')
		begin

			insert into appr_notice_prop_list
			(
				notice_yr, 
				notice_num,  
				prop_id,     
				owner_id,
				notice_owner_id,    
				sup_num,     
				sup_yr,  
				special_group_id,
				last_appr_yr_19i
			)
			select  distinct
				@input_notice_yr,
		       		@input_notice_num,
		       		psa.prop_id,
				o.owner_id,
				o.owner_id,
		       		psa.sup_num,
		       		psa.owner_tax_yr,	
				@input_special_group_id,
		       		'T'

			from
				special_group_prop_assoc as sgpa with (nolock)
			inner join
				special_group as sg with (nolock)
			on
				sg.special_group_id = sgpa.special_group_id
			inner join
				property as p with (nolock)
			on
				p.prop_id = sgpa.prop_id
			inner join
				prop_supp_assoc as psa with (nolock)
			on
				psa.prop_id = sgpa.prop_id
			and	psa.owner_tax_yr = sgpa.prop_val_yr
			inner join
				property_val as pv with (nolock)
			on
				pv.prop_id = psa.prop_id
			and	pv.prop_val_yr = psa.owner_tax_yr
			and	pv.sup_num = psa.sup_num
			and	pv.prop_inactive_dt is null
			and	pv.last_appraisal_yr > @last_appr_year_19i
			inner join
				owner as o with (nolock)
			on
				o.prop_id = pv.prop_id
			and	o.owner_tax_yr = pv.prop_val_yr
			and	o.sup_num = pv.sup_num
			where
				sgpa.special_group_id = @input_special_group_id
			and	sgpa.prop_val_yr = @input_notice_yr
			and	exists
			(
				select
					*
				from
					shared_prop as sp with (nolock)
				where
					sp.pacs_prop_id = psa.prop_id
				and	sp.shared_year = psa.owner_tax_yr
				and	sp.sup_num = psa.sup_num
			)
			and	not exists
			(
				select
					*
				from
					appr_notice_prop_list as anpl with (nolock)
				where
					anpl.prop_id = psa.prop_id
				and	anpl.owner_id = o.owner_id
				and	anpl.notice_owner_id = o.owner_id
				and	anpl.sup_yr = psa.owner_tax_yr
				and	anpl.sup_num = psa.sup_num
				and	anpl.notice_yr = @input_notice_yr
				and	anpl.notice_num = @input_notice_num
			)

			union

			select  distinct
				@input_notice_yr,
		       		@input_notice_num,
		       		psa.prop_id,
				o.owner_id,
				o.owner_id,
		       		psa.sup_num,
		       		psa.owner_tax_yr,	
				@input_special_group_id,
		       		'T'
			from
				special_group_owner_assoc as sgoa with (nolock)
			inner join
				special_group as sg with (nolock)
			on
				sg.special_group_id = sgoa.special_group_id
			inner join
				owner as o with (nolock)
			on
				o.owner_id = sgoa.owner_id
			and	o.owner_tax_yr = sgoa.owner_tax_yr
			inner join
				property as p with (nolock)
			on
				p.prop_id = o.prop_id
			inner join
				prop_supp_assoc as psa with (nolock)
			on
				psa.prop_id = o.prop_id
			and	psa.owner_tax_yr = o.owner_tax_yr
			and	psa.sup_num = o.sup_num
			inner join
				property_val as pv with (nolock)
			on
				pv.prop_id = psa.prop_id
			and	pv.prop_val_yr = psa.owner_tax_yr
			and	pv.sup_num = psa.sup_num
			and	pv.prop_inactive_dt is null
			and	pv.last_appraisal_yr > @last_appr_year_19i
			where
				sgoa.special_group_id = @input_special_group_id
			and	sgoa.owner_tax_yr = @input_notice_yr
			and	exists
			(
				select
					*
				from
					shared_prop as sp with (nolock)
				where
					sp.pacs_prop_id = psa.prop_id
				and	sp.shared_year = psa.owner_tax_yr
				and	sp.sup_num = psa.sup_num
			)
			and	not exists
			(
				select
					*
				from
					appr_notice_prop_list as anpl with (nolock)
				where
					anpl.prop_id = psa.prop_id
				and	anpl.owner_id = o.owner_id
				and	anpl.notice_owner_id = o.owner_id
				and	anpl.sup_yr = psa.owner_tax_yr
				and	anpl.sup_num = psa.sup_num
				and	anpl.notice_yr = @input_notice_yr
				and	anpl.notice_num = @input_notice_num
			)
		end
	end 
end

GO

