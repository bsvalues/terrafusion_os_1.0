


create view Comm_imprv_3 as 

select Distinct 
		--rtrim(prop_id)+'('+RTRIM(imprv_desc)+')'+'('+RTRIM(row_id)+')' as imprv_number
		rtrim(imprv_desc)+'('+RTRIM(row_id)+')' as imprv_number
		,imprv_desc
      ,[prop_val_yr]
      ,[imprv_id]
      ,[sup_num]
      ,[sale_id]
      ,[imprv_type_cd]
      ,[imprv_sl_locked]
      ,[primary_imprv]
      ,[imprv_state_cd]
      ,[imprv_homesite]
      ,[imprv_val]
      ,[misc_cd]
      ,[imp_new_yr]
      ,[imp_new_val]
      ,[imp_new_val_override]
      ,[original_val]
      ,[base_val]
      ,[calc_val]
      ,[adjusted_val]
      ,[living_area_up]
      ,[err_flag]
      ,[imp_new_pc]
      ,[flat_val]
      ,[value_type]
      ,[imprv_adj_amt]
      ,[imprv_adj_factor]
      ,[imprv_mass_adj_factor]
      ,[imprv_val_source]
      ,[economic_pct]
      ,[physical_pct]
      ,[functional_pct]
      ,[economic_cmnt]
      ,[physical_cmnt]
      ,[functional_cmnt]
      ,[effective_yr_blt]
      ,[percent_complete]
      ,[stories]
      ,[dep_pct]
      ,[dep_cmnt]
      ,[dist_val]
      ,[primary_use_cd]
      ,[actual_year_built]
      ,[building_number]
      ,[building_name]
     ,[building_id]




			from imprv_number
			where imprv_desc is not null and imprv_type_cd ='c'
			and row_id=3
			--order by prop_id

GO

