
create procedure RecalcRowUpdateIncomeGRMGIM
	@income_yr numeric(4,0),
	@sup_num int,
	@income_id int,

	@sch_pgi_annual numeric(14,0),
	@sch_pgi_monthly numeric(14,0),
	@sch_gim numeric(5,2),
	@sch_grm numeric(5,2),

	@pf_pgi_annual numeric(14,0),
	@pf_pgi_monthly numeric(14,0),
	@pf_gim numeric(5,2),
	@pf_grm numeric(5,2),

	@dc_pgi_annual numeric(14,0),
	@dc_pgi_monthly numeric(14,0),
	@dc_gim numeric(5,2),
	@dc_grm numeric(5,2),

	@sch_indicated_value_gim numeric(14,0),
	@sch_indicated_value_grm numeric(14,0),
	@sch_base_indicated_value numeric(14,0),
	@sch_indicated_value numeric(14,0),

	@pf_indicated_value_gim numeric(14,0),
	@pf_indicated_value_grm numeric(14,0),
	@pf_base_indicated_value numeric(14,0),
	@pf_indicated_value numeric(14,0),

	@dc_indicated_value_gim numeric(14,0),
	@dc_indicated_value_grm numeric(14,0),
	@dc_base_indicated_value numeric(14,0),
	@dc_indicated_value numeric(14,0)
as

set nocount on

	update income_grm_gim with(rowlock)
	set
		sch_pgi_annual = @sch_pgi_annual,
		sch_pgi_monthly = @sch_pgi_monthly,
		sch_gim = @sch_gim,
		sch_grm = @sch_grm,

		pf_pgi_annual = @pf_pgi_annual,
		pf_pgi_monthly = @pf_pgi_monthly,
		pf_gim = @pf_gim,
		pf_grm = @pf_grm,

		dc_pgi_annual = @dc_pgi_annual,
		dc_pgi_monthly = @dc_pgi_monthly,
		dc_gim = @dc_gim,
		dc_grm = @dc_grm,

		sch_indicated_value_gim = @sch_indicated_value_gim,
		sch_indicated_value_grm = @sch_indicated_value_grm,
		sch_base_indicated_value = @sch_base_indicated_value,
		sch_indicated_value = @sch_indicated_value,

		pf_indicated_value_gim = @pf_indicated_value_gim,
		pf_indicated_value_grm = @pf_indicated_value_grm,
		pf_base_indicated_value = @pf_base_indicated_value,
		pf_indicated_value = @pf_indicated_value,

		dc_indicated_value_gim = @dc_indicated_value_gim,
		dc_indicated_value_grm = @dc_indicated_value_grm,
		dc_base_indicated_value = @dc_base_indicated_value,
		dc_indicated_value = @dc_indicated_value
	where
		income_yr = @income_yr and
		sup_num = @sup_num and
		income_id = @income_id

GO

