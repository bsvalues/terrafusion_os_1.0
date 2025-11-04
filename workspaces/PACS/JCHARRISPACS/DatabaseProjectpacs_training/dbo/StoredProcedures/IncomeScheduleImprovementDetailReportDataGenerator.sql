
create procedure IncomeScheduleImprovementDetailReportDataGenerator
	@dataset_id int,
	@area_type bit,
	@year numeric(4,0),
	@area varchar(10),
	@imprv_det_type_cd char(10),
	@imprv_det_meth_cd char(5)

as

set nocount on

if @area_type = 1
begin
	-- economic area schedules
	insert ##income_schedule_improvement_detail
	(dataset_id, [year], area_type, area, imprv_det_type_cd, imprv_det_meth_cd, area_desc,
	 imprv_det_type_desc, imprv_det_meth_desc, use_matrices, do_not_use_tax_rate_in_overall_rate,
	 rent_rate, rent_rate_period, collection_loss, occupancy_rate, secondary_income_rsf,
	 cap_rate, expense_rsf, expense_ratio)

	select @dataset_id, isie.[year], @area_type, isie.economic_area, isie.imprv_det_type_cd, isie.imprv_det_meth_cd,
		iea.econ_desc, idt.imprv_det_typ_desc, idm.imprv_det_meth_dsc, isie.use_matrix,
		isie.do_not_use_tax_rate, isie.rent_rate, isie.rent_rate_period, isie.collection_loss,
		isie.occupancy_rate, isie.secondary_income_rsf, isie.cap_rate, isie.expense_rsf,
		isie.expense_ratio
		
	from income_sched_imprv_econ as isie with(nolock)
	
	join income_econ_area as iea with(nolock)
	on isie.economic_area = iea.econ_cd
	
	join imprv_det_type as idt with(nolock)
	on isie.imprv_det_type_cd = idt.imprv_det_type_cd
	
	join imprv_det_meth as idm with(nolock)
	on isie.imprv_det_meth_cd = idm.imprv_det_meth_cd
	
	where [year] = @year
	and (isie.economic_area = @area or @area is null)
	and (isie.imprv_det_type_cd = @imprv_det_type_cd or @imprv_det_type_cd is null)
	and (isie.imprv_det_meth_cd = @imprv_det_meth_cd or @imprv_det_meth_cd is null)


	insert ##income_schedule_improvement_detail_assoc
	(dataset_id, [year], area_type, area, imprv_det_type_cd, imprv_det_meth_cd,
	 matrix_id, matrix_order, adj_factor, matrix_description, matrix_sub_type_cd, matrix_sub_type_desc,
	 label, axis_1_cd, axis_1_data_type, axis_2_cd, axis_2_data_type, operator)

	select @dataset_id, iids.[year], @area_type, iids.area, iids.imprv_det_type_cd, iids.imprv_det_meth_cd,
		isiema.matrix_id, isiema.matrix_order, isiema.adj_factor, m.matrix_description,
		m.matrix_sub_type_cd, mst.matrix_sub_type_desc, m.label, m.axis_1, ma1.data_type, m.axis_2,
		ma2.data_type, m.operator

	from ##income_schedule_improvement_detail as iids with(nolock)
	
	join income_sched_imprv_econ_matrix_assoc as isiema with(nolock)
	on iids.[year] = isiema.[year]
	and iids.area = isiema.economic_area
	and iids.imprv_det_type_cd = isiema.imprv_det_type_cd
	and iids.imprv_det_meth_cd = isiema.imprv_det_meth_cd
	
	join matrix as m with(nolock)
	on iids.[year] = m.matrix_yr
	and isiema.matrix_id = m.matrix_id
	
	join matrix_axis as ma1 with(nolock)
	on m.matrix_yr = ma1.matrix_yr
	and m.matrix_type = ma1.matrix_type
	and m.axis_1 = ma1.axis_cd
	
	join matrix_axis as ma2 with(nolock)
	on m.matrix_yr = ma2.matrix_yr
	and m.matrix_type = ma2.matrix_type
	and m.axis_2 = ma2.axis_cd
	
	join matrix_sub_type as mst with(nolock)
	on m.matrix_sub_type_cd = mst.matrix_sub_type_cd
	and m.matrix_type = mst.matrix_type
end

else begin
	-- neighborhood schedules
	insert ##income_schedule_improvement_detail
	(dataset_id, [year], area_type, area, imprv_det_type_cd, imprv_det_meth_cd, area_desc,
	 imprv_det_type_desc, imprv_det_meth_desc, use_matrices, do_not_use_tax_rate_in_overall_rate,
	 rent_rate, rent_rate_period, collection_loss, occupancy_rate, secondary_income_rsf,
	 cap_rate, expense_rsf, expense_ratio)

	select @dataset_id, isid.[year], @area_type, isid.hood_cd, isid.imprv_det_type_cd, isid.imprv_det_meth_cd,
		n.hood_name, idt.imprv_det_typ_desc, idm.imprv_det_meth_dsc, isid.use_matrix,
		isid.do_not_use_tax_rate, isid.rent_rate, isid.rent_rate_period, isid.collection_loss,
		isid.occupancy_rate, isid.secondary_income_rsf, isid.cap_rate, isid.expense_rsf,
		isid.expense_ratio
		
	from income_sched_imprv_detail as isid with(nolock)
	
	join neighborhood as n with(nolock)
	on isid.[year] = n.hood_yr
	and isid.hood_cd = n.hood_cd
	
	join imprv_det_type as idt with(nolock)
	on isid.imprv_det_type_cd = idt.imprv_det_type_cd
	
	join imprv_det_meth as idm with(nolock)
	on isid.imprv_det_meth_cd = idm.imprv_det_meth_cd
	
	where [year] = @year
	and (isid.hood_cd = @area or @area is null)
	and (isid.imprv_det_type_cd = @imprv_det_type_cd or @imprv_det_type_cd is null)
	and (isid.imprv_det_meth_cd = @imprv_det_meth_cd or @imprv_det_meth_cd is null)


	insert ##income_schedule_improvement_detail_assoc
	(dataset_id, [year], area_type, area, imprv_det_type_cd, imprv_det_meth_cd,
	 matrix_id, matrix_order, adj_factor, matrix_description, matrix_sub_type_cd, matrix_sub_type_desc,
	 label, axis_1_cd, axis_1_data_type, axis_2_cd, axis_2_data_type, operator)

	select @dataset_id, iids.[year], @area_type, iids.area, iids.imprv_det_type_cd, iids.imprv_det_meth_cd,
		isidma.matrix_id, isidma.matrix_order, isidma.adj_factor, m.matrix_description,
		m.matrix_sub_type_cd, mst.matrix_sub_type_desc, m.label, m.axis_1, ma1.data_type, m.axis_2,
		ma2.data_type, m.operator

	from ##income_schedule_improvement_detail as iids with(nolock)
	
	join income_sched_imprv_detail_matrix_assoc as isidma with(nolock)
	on iids.[year] = isidma.[year]
	and iids.area = isidma.hood_cd
	and iids.imprv_det_type_cd = isidma.imprv_det_type_cd
	and iids.imprv_det_meth_cd = isidma.imprv_det_meth_cd
	
	join matrix as m with(nolock)
	on iids.[year] = m.matrix_yr
	and isidma.matrix_id = m.matrix_id
	
	join matrix_axis as ma1 with(nolock)
	on m.matrix_yr = ma1.matrix_yr
	and m.matrix_type = ma1.matrix_type
	and m.axis_1 = ma1.axis_cd
	
	join matrix_axis as ma2 with(nolock)
	on m.matrix_yr = ma2.matrix_yr
	and m.matrix_type = ma2.matrix_type
	and m.axis_2 = ma2.axis_cd
	
	join matrix_sub_type as mst with(nolock)
	on m.matrix_sub_type_cd = mst.matrix_sub_type_cd
	and m.matrix_type = mst.matrix_type
end


-- matrix table: same for both
insert ##income_schedule_improvement_detail_matrix
(dataset_id, [year], area_type, area, imprv_det_type_cd, imprv_det_meth_cd,
 matrix_id, axis_1_value, axis_1_number, axis_1_order,
 axis_2_value, axis_2_number, axis_2_order, cell_value)

select @dataset_id, iidsa.[year], @area_type, iidsa.area, iidsa.imprv_det_type_cd, iidsa.imprv_det_meth_cd,
	iidsa.matrix_id, md.axis_1_value, mad1.axis_number, mad1.axis_order,
	md.axis_2_value, mad2.axis_number, mad2.axis_order, md.cell_value

from ##income_schedule_improvement_detail_assoc as iidsa with(nolock)

join matrix_detail as md with(nolock)
on iidsa.[year] = md.matrix_yr
and iidsa.matrix_id = md.matrix_id

join matrix_axis_detail as mad1 with(nolock)
on md.matrix_id = mad1.matrix_id
and md.matrix_yr = mad1.matrix_yr
and md.axis_1_value = mad1.axis_value
and mad1.axis_number = 1

join matrix_axis_detail as mad2 with(nolock)
on md.matrix_id = mad2.matrix_id
and md.matrix_yr = mad2.matrix_yr
and md.axis_2_value = mad2.axis_value
and mad2.axis_number = 2

GO

