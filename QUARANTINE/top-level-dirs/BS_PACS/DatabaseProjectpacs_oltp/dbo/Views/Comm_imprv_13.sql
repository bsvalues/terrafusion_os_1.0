


create view 
Comm_imprv_13
--Comm_imprv_14
--Comm_imprv_15
--Comm_imprv_16
--Comm_imprv_17
--Comm_imprv_18
--Comm_imprv_19
--Comm_imprv_20
--Comm_imprv_21
--Comm_imprv_22
--Comm_imprv_23
--Comm_imprv_24
--Comm_imprv_25
--Comm_imprv_26
--Comm_imprv_27
--Comm_imprv_28
--Comm_imprv_29
--Comm_imprv_30
--Comm_imprv_31
--Comm_imprv_32
--Comm_imprv_33
--Comm_imprv_34
--Comm_imprv_35
--Comm_imprv_36
--Comm_imprv_37
--Comm_imprv_38
--Comm_imprv_39
--Comm_imprv_40
--Comm_imprv_41
--Comm_imprv_42
--Comm_imprv_43
--Comm_imprv_44
--Comm_imprv_45
--Comm_imprv_46
--Comm_imprv_47
	--Comm_imprv_48

as 
--create view Comm_imprv_7 as 

select Distinct 
		--rtrim(prop_id)+'('+RTRIM(imprv_desc)+')'+'('+RTRIM(row_id)+')' as imprv_number
		rtrim(imprv_desc)+'('+RTRIM(row_id)+')' as imprv_number
		,imprv_desc      ,[prop_val_yr]      ,[imprv_id]      ,[sup_num]      ,[sale_id]      ,[imprv_type_cd]      ,[imprv_sl_locked]      ,[primary_imprv]      ,[imprv_state_cd]      ,[imprv_homesite]      ,[imprv_val]      ,[misc_cd]      ,[imp_new_yr]      ,[imp_new_val]      ,[imp_new_val_override]      ,[original_val]      ,[base_val]      ,[calc_val]      ,[adjusted_val]      ,[living_area_up]      ,[err_flag]
      ,[imp_new_pc]      ,[flat_val]      ,[value_type]      ,[imprv_adj_amt]      ,[imprv_adj_factor]      ,[imprv_mass_adj_factor]      ,[imprv_val_source]
      ,[economic_pct]      ,[physical_pct]      ,[functional_pct]      ,[economic_cmnt]      ,[physical_cmnt]      ,[functional_cmnt]      ,[effective_yr_blt]      ,[percent_complete]      ,[stories]      ,[dep_pct]      ,[dep_cmnt]
      ,[dist_val]      ,[primary_use_cd]      ,[actual_year_built]      ,[building_number]      ,[building_name]     ,[building_id]

			from imprv_number
			where imprv_desc is not null and imprv_type_cd ='c'
		and row_id=13
			--and row_id=14
			--and row_id=15
			--and row_id=16
			--and row_id=17
			--and row_id=18
			--and row_id=19
			--and row_id=20
			--and row_id=21
			--and row_id=22
			--and row_id=23
			--and row_id=24
			--and row_id=25
			--and row_id=26
			--and row_id=27
			--and row_id=28
			--and row_id=29
			--and row_id=30
			--and row_id=31
			--and row_id=32
			--and row_id=33
			--and row_id=34
			--and row_id=35
			--and row_id=36
			--and row_id=37
			--and row_id=38
			--and row_id=39
			--and row_id=40
			--and row_id=41
			--and row_id=42
			--and row_id=43
			--and row_id=44
			--and row_id=45
			--and row_id=46
			--and row_id=47
			--and row_id=48
			

			--order by prop_id

GO

