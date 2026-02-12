
create procedure CopyIncomeScheduleImprovementDetail 

	@area_type int,  
	@old_year numeric(4,0),
	@old_area varchar(10),
	@old_type_cd varchar(10),
	@old_method_cd varchar(5),
	@new_year numeric(4,0),
	@new_area varchar(10),
	@new_type_cd varchar(10),
	@new_method_cd varchar(5)

as

set nocount on

if (@area_type = 1)
begin
	-- economic area
	insert income_sched_imprv_econ
	([year], economic_area, imprv_det_type_cd, imprv_det_meth_cd,
	 use_matrix, rent_rate, collection_loss, occupancy_rate,
	 secondary_income_rsf, cap_rate, expense_rsf, expense_ratio,
	 do_not_use_tax_rate, rent_rate_period
	)

	select @new_year, @new_area, @new_type_cd, @new_method_cd,
		use_matrix, rent_rate, collection_loss, occupancy_rate,
		secondary_income_rsf, cap_rate, expense_rsf, expense_ratio,
		do_not_use_tax_rate, rent_rate_period

	from income_sched_imprv_econ
	where [year] = @old_year
	and economic_area = @old_area
	and imprv_det_type_cd = @old_type_cd
	and imprv_det_meth_cd = @old_method_cd


	insert income_sched_imprv_econ_matrix_assoc
	([year], economic_area, imprv_det_type_cd, imprv_det_meth_cd,
	 matrix_id, matrix_order, adj_factor)

	select @new_year, @new_area, @new_type_cd, @new_method_cd,
		matrix_id, matrix_order, adj_factor
	from income_sched_imprv_econ_matrix_assoc
	where [year] = @old_year
	and economic_area = @old_area
	and imprv_det_type_cd = @old_type_cd
	and imprv_det_meth_cd = @old_method_cd

end

else begin
	-- neighborhood code
	insert income_sched_imprv_detail
	([year], hood_cd, imprv_det_type_cd, imprv_det_meth_cd,
	 use_matrix, rent_rate, collection_loss, occupancy_rate,
	 secondary_income_rsf, cap_rate, expense_rsf, expense_ratio,
	 do_not_use_tax_rate, rent_rate_period
	)

	select @new_year, @new_area, @new_type_cd, @new_method_cd,
		use_matrix, rent_rate, collection_loss, occupancy_rate,
		secondary_income_rsf, cap_rate, expense_rsf, expense_ratio,
		do_not_use_tax_rate, rent_rate_period

	from income_sched_imprv_detail
	where [year] = @old_year
	and hood_cd = @old_area
	and imprv_det_type_cd = @old_type_cd
	and imprv_det_meth_cd = @old_method_cd


	insert income_sched_imprv_detail_matrix_assoc
	([year], hood_cd, imprv_det_type_cd, imprv_det_meth_cd,
	 matrix_id, matrix_order, adj_factor)

	select @new_year, @new_area, @new_type_cd, @new_method_cd,
		matrix_id, matrix_order, adj_factor
	from income_sched_imprv_detail_matrix_assoc
	where [year] = @old_year
	and hood_cd = @old_area
	and imprv_det_type_cd = @old_type_cd
	and imprv_det_meth_cd = @old_method_cd

end

GO

