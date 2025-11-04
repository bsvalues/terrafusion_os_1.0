
CREATE PROCEDURE UpdateApprNoticeSpecialGroup
	@input_notice_yr	numeric(4),
	@input_notice_num	int,
	@special_group_id	int
AS

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
declare @sql				nvarchar(4000)
declare @sql_insert			varchar(2000)
declare @sql_insert_list		varchar(2000)
declare @sql_from_list			varchar(2000)
declare @sql_from			varchar(2000)
declare @sql_where			varchar(2000)
declare @sql_where_alt			varchar(2000)
declare @loop_varb			int
declare @this_option			char(1)
declare @all_field_name			varchar(20)
declare @prop_type_cd			varchar(2)

if exists (select * 
	   from appr_notice_selection_criteria
           where notice_yr  = @input_notice_yr
	   and   notice_num = @input_notice_num)
begin 
	select  
		@use_assessed			= use_assd_19a,
		@use_market			= use_mkt_19a,
		@use_code_19a			= use_include_code_19a,
		@use_code_19ac			= use_include_code_19ac,
		@use_exclude_code_19a		= use_exclude_code_x19a, 
		@use_rend_19a			= use_include_props_w_rend_19a,
		@rend_19a_option		= rend_19a_option,
		@real_option			= real_option,
		@personal_option		= personal_option,
		@mineral_option			= mineral_option,
		@mobile_option			= mobile_option,
		@auto_option			= auto_option,
		@shared_prop_option		= shared_prop_option,
		@use_value_inc_greater_19a 	= use_value_inc_greater_than_19a,
		@inc_amt_19a			= value_inc_greater_than_19a,
		@use_value_decr_less_19a	= use_value_decr_less_than_19a,
		@decr_amt_19a			= value_decr_less_than_19a,
		@use_new_prop_19a		= use_new_prop_19a,
		@use_group_codes_list		= use_group_codes_list
	from appr_notice_selection_criteria
	where notice_yr  = @input_notice_yr
	and   notice_num = @input_notice_num
	
select @loop_varb = 1

WHILE @loop_varb <> 0
BEGIN
	if (@loop_varb = 6)
	begin
		select @this_option = @shared_prop_option
		select @all_field_name = 'all_shared'
		select @loop_varb = 0
	end

	if (@loop_varb = 5)
	begin
		select @this_option = @auto_option
		select @all_field_name = 'all_auto'
		select @prop_type_cd = 'A'
		select @loop_varb = 6
	end

	if (@loop_varb = 4)
	begin
		select @this_option = @mobile_option
		select @all_field_name = 'all_mobile'
		select @prop_type_cd = 'MH'
		select @loop_varb = 5
	end

	if (@loop_varb = 3)
	begin
		select @this_option = @mineral_option
		select @all_field_name = 'all_mineral'
		select @prop_type_cd = 'M'
		select @loop_varb = 4
	end

	if (@loop_varb = 2)
	begin
		select @this_option = @personal_option
		select @all_field_name = 'all_personal'
		select @prop_type_cd = 'P'
		select @loop_varb = 3
	end

	if (@loop_varb = 1)
	begin
		select @this_option = @real_option
		select @all_field_name = 'all_real'
		select @prop_type_cd = 'R'
		select @loop_varb = 2
	end

	select @sql_insert =		'INSERT INTO appr_notice_prop_list '

	select @sql_from =		'SELECT ' + STR(@input_notice_yr) + ', ' + STR(@input_notice_num) + ', '
	select @sql_from = @sql_from + 	'prop_supp_assoc.prop_id, owner.owner_id, owner.owner_id, prop_supp_assoc.sup_num, '
	select @sql_from = @sql_from + 	'prop_supp_assoc.owner_tax_yr, special_group.special_group_id, ' + STR(@special_group_id) + ', ''T'' '
	select @sql_from = @sql_from + 	'FROM special_group WITH (nolock) '
	select @sql_from = @sql_from + 	'INNER JOIN special_group_prop_assoc WITH (nolock) '
	select @sql_from = @sql_from + 	'	ON special_group_prop_assoc.special_group_id = special_group.special_group_id '
	select @sql_from = @sql_from + 	'INNER JOIN prop_supp_assoc WITH (nolock) '
	select @sql_from = @sql_from + 	'	ON prop_supp_assoc.prop_id = special_group_prop_assoc.prop_id '
	select @sql_from = @sql_from + 	'	AND prop_supp_assoc.owner_tax_yr = special_group_prop_assoc.prop_val_yr '
	select @sql_from = @sql_from + 	'INNER JOIN property_val WITH (nolock) '
	select @sql_from = @sql_from + 	'	ON property_val.prop_id = prop_supp_assoc.prop_id '
	select @sql_from = @sql_from + 	'	AND property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr '
	select @sql_from = @sql_from + 	'	AND property_val.sup_num = prop_supp_assoc.sup_num '
	select @sql_from = @sql_from + 	'	AND property_val.prop_inactive_dt is null '
	select @sql_from = @sql_from + 	'INNER JOIN owner WITH (nolock) '
	select @sql_from = @sql_from + 	'	ON owner.prop_id = prop_supp_assoc.prop_id '
	select @sql_from = @sql_from + 	'	AND owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr '
	select @sql_from = @sql_from + 	'	AND owner.sup_num = prop_supp_assoc.sup_num '
	select @sql_from = @sql_from + 	'INNER JOIN property WITH (nolock) '
	select @sql_from = @sql_from + 	'	ON property.prop_id = prop_supp_assoc.prop_id '

	select @sql_where = 		'WHERE	special_group.special_group_id = ' + STR(@special_group_id)
	select @sql_where = @sql_where +'	and prop_supp_assoc.owner_tax_yr = ' + STR(@input_notice_yr) 
	select @sql_where = @sql_where +'	and not exists (select * from appr_notice_prop_list '
	select @sql_where = @sql_where +'			where notice_yr = ' + STR(@input_notice_yr)
	select @sql_where = @sql_where +'			and   notice_num = ' + STR(@input_notice_num)
	select @sql_where = @sql_where +'			and   prop_id    = prop_supp_assoc.prop_id '
	select @sql_where = @sql_where +'	  		and   owner_id   = owner.owner_id '
	select @sql_where = @sql_where +'	   		and   sup_yr     = prop_supp_assoc.owner_tax_yr '
	select @sql_where = @sql_where +'	   		and   sup_num    = prop_supp_assoc.sup_num) '

	if (@loop_varb = 6)		/* shared property */
	begin
		select @sql_where = @sql_where +'and exists (select * from shared_prop sp '
		select @sql_where = @sql_where +'		where sp.pacs_prop_id = prop_supp_assoc.prop_id '
		select @sql_where = @sql_where +'		and   sp.shared_year = prop_supp_assoc.owner_tax_yr '
		select @sql_where = @sql_where +'		and   sp.sup_num = prop_supp_assoc.sup_num) '   

		select @sql_where_alt = REPLACE(@sql_where, 'prop_supp_assoc', 'curr_prop_prev_value_vw') 
		select @sql_where_alt = REPLACE(@sql_where_alt, '= owner.', '= curr_prop_prev_value_vw.') 
	end
	else
	begin				/* all other property */
		select @sql_where = @sql_where +'and not exists (select * from shared_prop sp '
		select @sql_where = @sql_where +'		where sp.pacs_prop_id = prop_supp_assoc.prop_id '
		select @sql_where = @sql_where +'		and   sp.shared_year = prop_supp_assoc.owner_tax_yr '
		select @sql_where = @sql_where +'		and   sp.sup_num = prop_supp_assoc.sup_num) '   

		select @sql_where_alt = REPLACE(@sql_where, 'prop_supp_assoc', 'curr_prop_prev_value_vw') 
		select @sql_where_alt = REPLACE(@sql_where_alt, '= owner.', '= curr_prop_prev_value_vw.') 

		select @sql_where = @sql_where + 'and property.prop_type_cd = ''' + @prop_type_cd + ''' '
		select @sql_where_alt = @sql_where_alt + 'and curr_prop_prev_value_vw.prop_type_cd = ''' + @prop_type_cd + ''' '
	end

	if (@this_option = 'A')		/* select all (property type) */
	begin
		select @sql_insert_list = '(notice_yr, notice_num, prop_id, owner_id, notice_owner_id, sup_num, sup_yr, special_group_id, ' 
		select @sql_insert_list = @sql_insert_list + @all_field_name + ' ) '

		select @sql = @sql_insert + @sql_insert_list + @sql_from + @sql_where 

		print @sql
		exec sp_executesql @sql
	end
	else if (@real_option = 'S')	/* select real based on selection criteria */
	begin
		if (@use_rend_19a = 'T')	/* include real properties with rendered value */
		begin
			if(@rend_19a_option = 'A') 	/* include them all */
			begin
				select @sql = 		@sql_insert
				select @sql = @sql + 	'(notice_yr, notice_num, prop_id, owner_id, notice_owner_id, sup_num, sup_yr, special_group_id, rend_19a ) '
				select @sql = @sql + 	@sql_from 
				select @sql = @sql + 	@sql_where 
				select @sql = @sql + 	'and property_val.rendered_yr = ' + STR(@input_notice_yr) + ' '
			end
			else				/* include only those whose assessed value > rendered value */
			begin
				if(@prop_type_cd = 'P')
				begin
					select @sql =		@sql_insert
					select @sql = @sql + 	'(notice_yr, notice_num, prop_id, owner_id, notice_owner_id, sup_num, sup_yr, special_group_id, rend_19a_ar ) '
					select @sql = @sql + 	@sql_from 
					select @sql = @sql +	'INNER JOIN (select prop_id, sum(rendition_value) as rendered_val from pers_prop_rendition where rendition_year = ' + STR(@input_notice_yr) + ' group by prop_id) AS tmp_tbl '
					select @sql = @sql +	'	ON tmp_tbl.prop_id = property_val.prop_id '
					select @sql = @sql + 	@sql_where 
					select @sql = @sql + 	'and property_val.assessed_val > tmp_tbl.rendered_val '

					exec sp_executesql @sql
				end
				else
				begin
					select @sql =		@sql_insert
					select @sql = @sql + 	'(notice_yr, notice_num, prop_id, owner_id, notice_owner_id, sup_num, sup_yr, special_group_id, rend_19a_ar ) '
					select @sql = @sql + 	@sql_from 
					select @sql = @sql + 	@sql_where 
					select @sql = @sql + 	'and property_val.rendered_yr = ' + STR(@input_notice_yr) + ' '
					select @sql = @sql + 	'and property_val.assessed_val > property_val.rendered_val '
				end
			end

			print @sql
			exec sp_executesql @sql
		end

		if (@use_group_codes_list = 'T') /* include properties with specific property group codes */
		begin
			select @sql =		@sql_insert
			select @sql = @sql + 	'(notice_yr, notice_num, prop_id, owner_id, notice_owner_id, sup_num, sup_yr, special_group_id, code_list ) '
			select @sql = @sql + 	@sql_from 
			select @sql = @sql + 	@sql_where 
			select @sql = @sql + 	'and prop_supp_assoc.prop_id in '
			select @sql = @sql + 	'	(SELECT prop_id from prop_group_assoc WITH (nolock) '
			select @sql = @sql + 	'	 INNER JOIN appr_notice_selection_criteria_group_codes anscgc WITH (nolock) '
			select @sql = @sql + 	'		ON anscgc.group_cd = prop_group_assoc.prop_group_cd '
			select @sql = @sql + 	'	 WHERE anscgc.notice_yr = ' + STR(@input_notice_yr)
			select @sql = @sql + 	'	 and anscgc.notice_num = ' + STR(@input_notice_num) + ') '

			print @sql
			exec sp_executesql @sql

			/* maintain backward compatibility */			
			UPDATE appr_notice_prop_list
			SET code_x19a = 'T'
			WHERE	notice_yr = @input_notice_yr
				and notice_num = @input_notice_num
				and prop_id in (select prop_id from prop_group_assoc where prop_group_cd = '25.19A')

			UPDATE appr_notice_prop_list
			SET code_x19ac = 'T'
			WHERE	notice_yr = @input_notice_yr
				and notice_num = @input_notice_num
				and prop_id in (select prop_id from prop_group_assoc where prop_group_cd = '25.19AC')
		end
		else
		begin		/* maintain backward compatibility */
			if (@use_code_19a = 'T')
			begin
				select @sql =		@sql_insert
				select @sql = @sql + 	'(notice_yr, notice_num, prop_id, owner_id, notice_owner_id, sup_num, sup_yr, special_group_id, code_x19a ) '
				select @sql = @sql + 	@sql_from 
				select @sql = @sql + 	'INNER JOIN prop_group_assoc WITH (nolock) '
				select @sql = @sql + 	'	ON prop_group_assoc.prop_id = prop_supp_assoc.prop_id '
				select @sql = @sql + 	'	and    prop_group_assoc.prop_group_cd = ''25.19A'' '
				select @sql = @sql + 	@sql_where 

				print @sql
				exec sp_executesql @sql
			end

			if (@use_code_19ac = 'T')
			begin
				select @sql =		@sql_insert
				select @sql = @sql + 	'(notice_yr, notice_num, prop_id, owner_id, notice_owner_id, sup_num, sup_yr, special_group_id, code_x19ac ) '
				select @sql = @sql + 	@sql_from 
				select @sql = @sql + 	'INNER JOIN prop_group_assoc WITH (nolock) '
				select @sql = @sql + 	'	ON prop_group_assoc.prop_id = prop_supp_assoc.prop_id '
				select @sql = @sql + 	'	and    prop_group_assoc.prop_group_cd = ''25.19AC'' '
				select @sql = @sql + 	@sql_where 

				print @sql
				exec sp_executesql @sql
			end
		end

		if (@use_value_decr_less_19a = 'T')
		begin
			if (@use_assessed = 'T')
			begin
				select @sql =		@sql_insert
				select @sql = @sql + 	'(notice_yr, notice_num, prop_id, owner_id, notice_owner_id, sup_num, sup_yr, special_group_id, value_decr_19a ) '
				select @sql = @sql + 	'SELECT ' + STR(@input_notice_yr) + ', ' + STR(@input_notice_num) + ', '
			       	select @sql = @sql + 	'curr_prop_prev_value_vw.prop_id, curr_prop_prev_value_vw.owner_id, curr_prop_prev_value_vw.owner_id, curr_prop_prev_value_vw.sup_num, curr_prop_prev_value_vw.owner_tax_yr, ' + STR(@special_group_id) + ', ''T'' '
				select @sql = @sql + 	'FROM curr_prop_prev_value_vw WITH (nolock) ' 
				select @sql = @sql + 	'INNER JOIN special_group_prop_assoc WITH (nolock) '
				select @sql = @sql + 	'	ON curr_prop_prev_value_vw.prop_id = special_group_prop_assoc.prop_id '
				select @sql = @sql + 	'	AND curr_prop_prev_value_vw.owner_tax_yr = special_group_prop_assoc.prop_val_yr '
				select @sql = @sql + 	'INNER JOIN special_group WITH (nolock) '
				select @sql = @sql + 	'	ON special_group_prop_assoc.special_group_id = special_group.special_group_id '
				select @sql = @sql + 	@sql_where_alt
				select @sql = @sql + 	'and    (assessed_val - prev_assessed) < 0 '
				select @sql = @sql + 	'and    ((assessed_val - prev_assessed) * -1) >= ' + STR(@decr_amt_19a) + ' '

				print @sql
				exec sp_executesql @sql
			end

			if (@use_market	 = 'T')
			begin
				select @sql = 		@sql_insert
				select @sql = @sql + 	'(notice_yr, notice_num, prop_id, owner_id, notice_owner_id, sup_num, sup_yr, special_group_id, value_decr_19a ) '
				select @sql = @sql + 	'SELECT ' + STR(@input_notice_yr) + ', ' + STR(@input_notice_num) + ', '
			       	select @sql = @sql + 	'curr_prop_prev_value_vw.prop_id, curr_prop_prev_value_vw.owner_id, curr_prop_prev_value_vw.owner_id, curr_prop_prev_value_vw.sup_num, curr_prop_prev_value_vw.owner_tax_yr, ' + STR(@special_group_id) + ', ''T'' '
				select @sql = @sql + 	'FROM curr_prop_prev_value_vw WITH (nolock) ' 
				select @sql = @sql + 	'INNER JOIN special_group_prop_assoc WITH (nolock) '
				select @sql = @sql + 	'	ON curr_prop_prev_value_vw.prop_id = special_group_prop_assoc.prop_id '
				select @sql = @sql + 	'	AND curr_prop_prev_value_vw.owner_tax_yr = special_group_prop_assoc.prop_val_yr '
				select @sql = @sql + 	'INNER JOIN special_group WITH (nolock) '
				select @sql = @sql + 	'	ON special_group_prop_assoc.special_group_id = special_group.special_group_id '
				select @sql = @sql + 	@sql_where_alt
				select @sql = @sql + 	'and    (market - prev_market) < 0 '
				select @sql = @sql + 	'and    ((market - prev_market) * -1) >= ' + STR(@decr_amt_19a) + ' '

				print @sql
				exec sp_executesql @sql
			end
		end

		if (@use_value_inc_greater_19a = 'T')
		begin
			if (@use_assessed = 'T')
			begin
				select @sql = 		@sql_insert
				select @sql = @sql + 	'(notice_yr, notice_num, prop_id, owner_id, notice_owner_id, sup_num, sup_yr, special_group_id, value_inc_19a ) '
				select @sql = @sql + 	'SELECT ' + STR(@input_notice_yr) + ', ' + STR(@input_notice_num) + ', '
			       	select @sql = @sql + 	'curr_prop_prev_value_vw.prop_id, curr_prop_prev_value_vw.owner_id, curr_prop_prev_value_vw.owner_id, curr_prop_prev_value_vw.sup_num, curr_prop_prev_value_vw.owner_tax_yr, ' + STR(@special_group_id) + ', ''T'' '
				select @sql = @sql + 	'FROM curr_prop_prev_value_vw WITH (nolock) ' 
				select @sql = @sql + 	'INNER JOIN special_group_prop_assoc WITH (nolock) '
				select @sql = @sql + 	'	ON curr_prop_prev_value_vw.prop_id = special_group_prop_assoc.prop_id '
				select @sql = @sql + 	'	AND curr_prop_prev_value_vw.owner_tax_yr = special_group_prop_assoc.prop_val_yr '
				select @sql = @sql + 	'INNER JOIN special_group WITH (nolock) '
				select @sql = @sql + 	'	ON special_group_prop_assoc.special_group_id = special_group.special_group_id '
				select @sql = @sql + 	@sql_where_alt
				select @sql = @sql + 	'and    (assessed_val - prev_assessed) >= ' + STR(@inc_amt_19a) + ' '

				print @sql
				exec sp_executesql @sql
			end

			if (@use_market	= 'T')
			begin
				select @sql = 		@sql_insert
				select @sql = @sql + 	'(notice_yr, notice_num, prop_id, owner_id, notice_owner_id, sup_num, sup_yr, special_group_id, value_inc_19a ) '
				select @sql = @sql + 	'SELECT ' + STR(@input_notice_yr) + ', ' + STR(@input_notice_num) + ', '
			       	select @sql = @sql + 	'curr_prop_prev_value_vw.prop_id, curr_prop_prev_value_vw.owner_id, curr_prop_prev_value_vw.owner_id, curr_prop_prev_value_vw.sup_num, curr_prop_prev_value_vw.owner_tax_yr, ' + STR(@special_group_id) + ', ''T'' '
				select @sql = @sql + 	'FROM curr_prop_prev_value_vw WITH (nolock) ' 
				select @sql = @sql + 	'INNER JOIN special_group_prop_assoc WITH (nolock) '
				select @sql = @sql + 	'	ON curr_prop_prev_value_vw.prop_id = special_group_prop_assoc.prop_id '
				select @sql = @sql + 	'	AND curr_prop_prev_value_vw.owner_tax_yr = special_group_prop_assoc.prop_val_yr '
				select @sql = @sql + 	'INNER JOIN special_group WITH (nolock) '
				select @sql = @sql + 	'	ON special_group_prop_assoc.special_group_id = special_group.special_group_id '
				select @sql = @sql + 	@sql_where_alt
				select @sql = @sql + 	'and    (market - prev_market) >= ' + STR(@inc_amt_19a) + ' '

				print @sql
				exec sp_executesql @sql
			end
		end

		if (@use_new_prop_19a = 'T')
		begin
			select @sql = 		@sql_insert
			select @sql = @sql + 	'(notice_yr, notice_num, prop_id, owner_id, notice_owner_id, sup_num, sup_yr, special_group_id, value_new_prop_19a ) '
			select @sql = @sql + 	@sql_from 
			select @sql = @sql + 	@sql_where 
			select @sql = @sql + 	'and not exists (SELECT * FROM prop_supp_assoc psa WITH (nolock) '
			select @sql = @sql + 	'		 WHERE psa.prop_id = prop_supp_assoc.prop_id '
			select @sql = @sql + 	'		 and psa.owner_tax_yr = ' + STR(@input_notice_yr - 1) + ') '

			print @sql
			exec sp_executesql @sql
		end

		if(@use_exclude_code_19a = 'T')
		begin
			DELETE FROM appr_notice_prop_list
			WHERE notice_yr = @input_notice_yr
			and notice_num = @input_notice_num
			and prop_id in (select prop_id from prop_group_assoc where prop_group_cd = 'X25.19A')
		end
	end 
END
end

GO

