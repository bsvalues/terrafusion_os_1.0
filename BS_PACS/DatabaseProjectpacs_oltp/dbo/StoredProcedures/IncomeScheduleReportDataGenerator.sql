
create procedure IncomeScheduleReportDataGenerator
	@dataset_id int,
	@year numeric(4,0),
	@econ_cd varchar(10),
	@prop_type_cd varchar(10),
	@class_cd varchar(10),
	@level_cd varchar(10),
	@report_type varchar(10)

as

set nocount on

	if @report_type = 'STANDARD'
	begin
		insert ##income_schedule_report
		(dataset_id, [year], econ_area, prop_type, class, [level], occupancy_rate,
		 management_rate, expense_rsf, secondary_income_rsf, tenant_imprv_rate,
		 reserve_for_replacement_rate, cap_rate, lease_rsf, vacancy,
		 econ_area_desc, prop_type_desc, class_desc, level_desc, do_not_use_tax_rate, triple_net_schedule)

		select @dataset_id, sched.income_yr, sched.econ_area, sched.prop_type, sched.class_cd,
			sched.level_cd, sched.ocr, sched.mgmtr, sched.exp_rsf, sched.si_rsf, sched.tir,
			sched.rrr, sched.capr, sched.lease_rsf, sched.vacancy,
			iea.econ_desc, ipt.prop_type_desc, ic.class_desc, il.level_desc, sched.do_not_use_tax_rate,
			sched.triple_net_schedule
		from income_sched as sched
		with (nolock)
		join income_econ_area as iea
		with (nolock)
		on sched.econ_area = iea.econ_cd
		join income_prop_type as ipt
		with (nolock)
		on sched.prop_type = ipt.prop_type_cd
		join income_class as ic
		with (nolock)
		on sched.class_cd = ic.class_cd
		join income_level as il
		with (nolock)
		on sched.level_cd = il.level_cd
		where sched.income_yr = @year
		and (sched.econ_area = @econ_cd or @econ_cd is null)
		and (sched.prop_type = @prop_type_cd or @prop_type_cd is null)
		and (sched.class_cd = @class_cd or @class_cd is null)
		and (sched.level_cd = @level_cd or @level_cd is null)
	end
	else
	begin
		insert ##income_schedule_grm_gim_report
		(dataset_id, [year], prop_type_cd, class_cd, econ_cd, level_cd,
		 potential_gross_income_annual, potential_gross_income_monthly,
		 gross_income_multiplier, gross_rent_multiplier,
		 econ_area_desc, prop_type_desc, class_desc, level_desc)

		select @dataset_id, isgg.[year], isgg.prop_type_cd, isgg.class_cd, isgg.econ_cd,
			isgg.level_cd, isgg.potential_gross_income_annual, isgg.potential_gross_income_monthly,
			isgg.gross_income_multiplier, isgg.gross_rent_multiplier,
			iea.econ_desc, ipt.prop_type_desc, ic.class_desc, il.level_desc
		from income_sched_grm_gim as isgg
		with (nolock)
		join income_econ_area as iea
		with (nolock)
		on isgg.econ_cd = iea.econ_cd
		join income_prop_type as ipt
		with (nolock)
		on isgg.prop_type_cd = ipt.prop_type_cd
		join income_class as ic
		with (nolock)
		on isgg.class_cd = ic.class_cd
		join income_level as il
		with (nolock)
		on isgg.level_cd = il.level_cd
		where isgg.[year] = @year
		and (isgg.prop_type_cd = @prop_type_cd or @prop_type_cd is null)
		and (isgg.class_cd = @class_cd or @class_cd is null)
		and (isgg.econ_cd = @econ_cd or @econ_cd is null)
		and (isgg.level_cd = @level_cd or @level_cd is null)
	end

-- ** 'End csp.IncomeScheduleReportDataGenerator.sql'

GO

