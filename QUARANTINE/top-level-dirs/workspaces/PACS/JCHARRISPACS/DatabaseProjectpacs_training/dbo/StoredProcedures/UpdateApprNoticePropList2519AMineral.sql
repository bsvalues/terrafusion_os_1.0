


CREATE procedure UpdateApprNoticePropList2519AMineral

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
						 
	
	/* select all mineral */
	if (@mineral_option = 'A')
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
		all_mineral
		)
		select @input_notice_yr,
		       	@input_notice_num,
		       	prop_supp_assoc.prop_id,
		       	owner.owner_id,
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
		and    property.prop_type_cd        = 'MN'
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
	/* select mineral based on selection criteria */
	else if (@mineral_option = 'S')
	begin
		

		if (@use_rend_19a = 'T')
		begin
			if(@rend_19a_option = 'A')
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
				rend_19a
				)
				select  @input_notice_yr,
		       			@input_notice_num,
		       			prop_supp_assoc.prop_id,
		       			owner.owner_id,
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
				and    property.prop_type_cd        = 'MN'
				and    prop_supp_assoc.prop_id      = property_val.prop_id
				and    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr
				and    prop_supp_assoc.sup_num      = property_val.sup_num
				and    property_val.prop_inactive_dt is null
				and    not exists (select * from shared_prop sp
						       where sp.pacs_prop_id = property_val.prop_id
						       and   sp.shared_year  = property_val.prop_val_yr
						       and   sp.sup_num		 = property_val.sup_num)   /* rk 02042004  */
				and    property_val.rendered_yr	    = @input_notice_yr
				and    not exists (select * 
				   		from  appr_notice_prop_list
				   		where prop_id    = prop_supp_assoc.prop_id
				  		and   owner_id   = owner.owner_id
				  		and   notice_owner_id   = owner.owner_id
				   		and   sup_yr     = prop_supp_assoc.owner_tax_yr
				   		and   sup_num    = prop_supp_assoc.sup_num
				   		and   notice_yr  = @input_notice_yr
				   		and   notice_num = @input_notice_num)
			end
			else
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
				rend_19a_ar
				)
				select @input_notice_yr,
		       			@input_notice_num,
		       			prop_supp_assoc.prop_id,
		       			owner.owner_id,
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
				and    property.prop_type_cd        = 'MN'
				and    prop_supp_assoc.prop_id      = property_val.prop_id
				and    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr

				and    prop_supp_assoc.sup_num      = property_val.sup_num
				and    property_val.prop_inactive_dt is null
				and    not exists (select * from shared_prop sp
						       where sp.pacs_prop_id = property_val.prop_id
						       and   sp.shared_year  = property_val.prop_val_yr
						       and   sp.sup_num		 = property_val.sup_num)   /* rk 02042004  */
				and    property_val.rendered_yr	    = @input_notice_yr
				and    property_val.assessed_val    > property_val.rendered_val
				and    not exists (select * 
				   		from  appr_notice_prop_list
				   		where prop_id    = prop_supp_assoc.prop_id
				  		and   owner_id   = owner.owner_id
				  		and   notice_owner_id   = owner.owner_id
				   		and   sup_yr     = prop_supp_assoc.owner_tax_yr
				   		and   sup_num    = prop_supp_assoc.sup_num
				   		and   notice_yr  = @input_notice_yr
				   		and   notice_num = @input_notice_num)
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
				prop_group_cd
			)
			select
				@input_notice_yr,
				@input_notice_num,
				pga.prop_id,
				pga.prop_group_cd
			from
				appr_notice_selection_criteria_group_codes as anscgc with (nolock)
			inner join
				prop_supp_assoc as psa with (nolock)
			on
				psa.owner_tax_yr = anscgc.notice_yr
			inner join
				property as p with (nolock)
			on
				p.prop_id = psa.prop_id
			and	p.prop_type_cd = 'MN'
			inner join
				prop_group_assoc as pga with (nolock)
			on
				pga.prop_id = p.prop_id
			and	pga.prop_group_cd = anscgc.group_cd
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
			and	not exists
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
				'T'
			from
				appr_notice_prop_list_group_code as anplgc with (nolock)
			inner join
				property as p with (nolock)
			on
				p.prop_id = anplgc.prop_id
			and	p.prop_type_cd = 'MN'
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
				psa.owner_tax_yr
		end			
		
		if (@use_value_decr_less_19a = 'T')
		begin

			
				if (@use_assessed = 'T')
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
					value_decr_19a
					)
					select @input_notice_yr,
		       				@input_notice_num,
		       				curr_prop_prev_value_vw.prop_id,
		       				curr_prop_prev_value_vw.owner_id,
		       				curr_prop_prev_value_vw.owner_id,
		       				curr_prop_prev_value_vw.sup_num,
		       				curr_prop_prev_value_vw.owner_tax_yr,	
		       				'T'
					from   curr_prop_prev_value_vw
					where  owner_tax_yr = @input_notice_yr
					and    not exists (select * from shared_prop sp
						       where sp.pacs_prop_id = curr_prop_prev_value_vw.prop_id
						       and   sp.shared_year  = curr_prop_prev_value_vw.owner_tax_yr
						       and   sp.sup_num		 = curr_prop_prev_value_vw.sup_num)   /* rk 02042004  */
					and    prop_type_cd = 'MN'
					and    (assessed_val - prev_assessed) < 0
					and    ((assessed_val - prev_assessed) * -1) >= @decr_amt_19a
					and    not exists (select * 
							 from  appr_notice_prop_list
							 where prop_id    = curr_prop_prev_value_vw.prop_id
				  			 and   owner_id   = curr_prop_prev_value_vw.owner_id
				  			 and   notice_owner_id   = curr_prop_prev_value_vw.owner_id
							 and   sup_yr     = curr_prop_prev_value_vw.owner_tax_yr
							 and   sup_num    = curr_prop_prev_value_vw.sup_num
							 and   notice_yr  = @input_notice_yr
							 and   notice_num = @input_notice_num)
				end
				
				if (@use_market	 = 'T')
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
					value_decr_19a
					)
					select @input_notice_yr,
		       				@input_notice_num,
		       				curr_prop_prev_value_vw.prop_id,
		       				curr_prop_prev_value_vw.owner_id,
		       				curr_prop_prev_value_vw.owner_id,
		       				curr_prop_prev_value_vw.sup_num,
		       				curr_prop_prev_value_vw.owner_tax_yr,	
		       				'T'
					from   curr_prop_prev_value_vw
					where  owner_tax_yr = @input_notice_yr
					and    prop_type_cd = 'MN'
					and    not exists (select * from shared_prop sp
						       where sp.pacs_prop_id = curr_prop_prev_value_vw.prop_id
						       and   sp.shared_year  = curr_prop_prev_value_vw.owner_tax_yr
						       and   sp.sup_num		 = curr_prop_prev_value_vw.sup_num)   /* rk 02042004  */
					and    (market - prev_market) < 0
					and    ((market - prev_market) * -1) >= @decr_amt_19a
					and    not exists (select * 
							 from  appr_notice_prop_list
							 where prop_id    = curr_prop_prev_value_vw.prop_id
				  			 and   owner_id   = curr_prop_prev_value_vw.owner_id
				  			 and   notice_owner_id   = curr_prop_prev_value_vw.owner_id
							 and   sup_yr     = curr_prop_prev_value_vw.owner_tax_yr
							 and   sup_num    = curr_prop_prev_value_vw.sup_num
							 and   notice_yr  = @input_notice_yr
							 and   notice_num = @input_notice_num)
				end
						
		end


		if (@use_value_inc_greater_19a = 'T')
		begin

			if (@use_assessed = 'T')
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
				value_inc_19a
				)
				select @input_notice_yr,
		       			@input_notice_num,
		       			curr_prop_prev_value_vw.prop_id,
		       			curr_prop_prev_value_vw.owner_id,
		       			curr_prop_prev_value_vw.owner_id,
		       			curr_prop_prev_value_vw.sup_num,
		       			curr_prop_prev_value_vw.owner_tax_yr,	
		       			'T'
				from   curr_prop_prev_value_vw
				where  owner_tax_yr = @input_notice_yr
				and    prop_type_cd = 'MN'
				and    not exists (select * from shared_prop sp
						       where sp.pacs_prop_id = curr_prop_prev_value_vw.prop_id
						       and   sp.shared_year  = curr_prop_prev_value_vw.owner_tax_yr
						       and   sp.sup_num		 = curr_prop_prev_value_vw.sup_num)   /* rk 02042004  */
				and    (assessed_val - prev_assessed) >= @inc_amt_19a
				and    not exists (select * 
				   		from  appr_notice_prop_list
				   		where prop_id    = curr_prop_prev_value_vw.prop_id
				  		and   owner_id   = curr_prop_prev_value_vw.owner_id
				  		and   notice_owner_id   = curr_prop_prev_value_vw.owner_id
				   		and   sup_yr     = curr_prop_prev_value_vw.owner_tax_yr
				   		and   sup_num    = curr_prop_prev_value_vw.sup_num
				   		and   notice_yr  = @input_notice_yr
				   		and   notice_num = @input_notice_num)
			end
			
			if (@use_market	= 'T')
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
				value_inc_19a
				)
				select @input_notice_yr,
		       			@input_notice_num,
		       			curr_prop_prev_value_vw.prop_id,
		       			curr_prop_prev_value_vw.owner_id,
		       			curr_prop_prev_value_vw.owner_id,
		       			curr_prop_prev_value_vw.sup_num,
		       			curr_prop_prev_value_vw.owner_tax_yr,	
		       			'T'
				from   curr_prop_prev_value_vw
				where  owner_tax_yr = @input_notice_yr
				and    prop_type_cd = 'MN'
				and    not exists (select * from shared_prop sp
						       where sp.pacs_prop_id = curr_prop_prev_value_vw.prop_id
						       and   sp.shared_year  = curr_prop_prev_value_vw.owner_tax_yr
						       and   sp.sup_num		 = curr_prop_prev_value_vw.sup_num)   /* rk 02042004  */
				and    (market - prev_market) >= @inc_amt_19a
				and    not exists (select * 
				   		from  appr_notice_prop_list
				   		where prop_id    = curr_prop_prev_value_vw.prop_id
				  		and   owner_id   = curr_prop_prev_value_vw.owner_id
				  		and   notice_owner_id   = curr_prop_prev_value_vw.owner_id
				   		and   sup_yr     = curr_prop_prev_value_vw.owner_tax_yr
				   		and   sup_num    = curr_prop_prev_value_vw.sup_num
				   		and   notice_yr  = @input_notice_yr
				   		and   notice_num = @input_notice_num)
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
			value_new_prop_19a
			)
			select @input_notice_yr,
		       	       @input_notice_num,
		       	       prop_supp_assoc.prop_id,
		       	       owner.owner_id,
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
			and    property.prop_type_cd        = 'MN'
			and    prop_supp_assoc.prop_id      = property_val.prop_id
			and    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr
			and    prop_supp_assoc.sup_num      = property_val.sup_num
			and not exists (select * from property_val pv, prop_supp_assoc psa
	    				where psa.prop_id = pv.prop_id
	    				and   psa.sup_num = pv.sup_num
	    				and   psa.owner_tax_yr = pv.prop_val_yr
	    				and   pv.prop_id = property.prop_id
	    				and   pv.prop_val_yr = (@input_notice_yr - 1))
			and    property_val.prop_inactive_dt is null
			and    not exists (select * from shared_prop sp
						       where sp.pacs_prop_id = property_val.prop_id
						       and   sp.shared_year  = property_val.prop_val_yr
						       and   sp.sup_num		 = property_val.sup_num)   /* rk 02042004  */
			and    not exists (select * 
				   	from  appr_notice_prop_list
				   	where prop_id    = prop_supp_assoc.prop_id
				  	and   owner_id   = owner.owner_id
				  	and   notice_owner_id   = owner.owner_id
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
			notice_owner_id,
			sup_num,     
			sup_yr,  
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
				'T'
			from prop_supp_assoc as psa
			join property_val as pv on
				pv.prop_val_yr = psa.owner_tax_yr and
				pv.sup_num = psa.sup_num and
				pv.prop_id = psa.prop_id and
				pv.prop_inactive_dt is null
			join owner as o on
				o.owner_tax_yr = psa.owner_tax_yr and
				o.sup_num = psa.sup_num and
				o.prop_id = psa.prop_id
			join property as p on
				p.prop_id = psa.prop_id and
				p.prop_type_cd = 'MN'
			where
				psa.owner_tax_yr = @input_notice_yr and
				exists (
					select coopa.prop_id
					from chg_of_owner_prop_assoc as coopa
					join chg_of_owner as coo on
						coo.chg_of_owner_id = coopa.chg_of_owner_id
					where
						coopa.prop_id = psa.prop_id and
						coo.deed_dt >= @last_owner_change_date_19i
				) and
				not exists (
					select sp.shared_year
					from shared_prop as sp
					where
						sp.shared_year = psa.owner_tax_yr and
						sp.sup_num = psa.sup_num and
						sp.pacs_prop_id = psa.prop_id
				) and
				not exists (
					select anpl.notice_yr
					from appr_notice_prop_list as anpl
					where
						anpl.notice_yr = psa.owner_tax_yr and
						anpl.notice_num = @input_notice_num and
						anpl.prop_id = psa.prop_id and
						anpl.sup_yr = psa.owner_tax_yr and
						anpl.sup_num = psa.sup_num and
						anpl.owner_id = o.owner_id
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
			last_appr_yr_19i
			)
			select  distinct
				@input_notice_yr,
		       		@input_notice_num,
		       		prop_supp_assoc.prop_id,
				owner.owner_id,
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
			and    property.prop_type_cd        = 'MN'
			and    prop_supp_assoc.prop_id      = property_val.prop_id
			and    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr
			and    prop_supp_assoc.sup_num      = property_val.sup_num
			and    property_val.prop_inactive_dt is null
			and    not exists (select * from shared_prop sp
						       where sp.pacs_prop_id = property_val.prop_id
						       and   sp.shared_year  = property_val.prop_val_yr
						       and   sp.sup_num		 = property_val.sup_num)			/* rk 02042004  */
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

