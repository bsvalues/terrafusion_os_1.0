




create procedure FreezeCeilingNewlyApprovedEntityFreezeCeilingCalculation
	@run_id int
as


declare @action_indicator int
declare @action_message varchar(100)
declare @report_sort_order int
declare @prop_id int
declare @owner_id int
declare @entity_id int
declare @tax_yr numeric(4,0)
declare @sup_num int
declare @freeze_type varchar(5)
declare @use_freeze char(1)
declare @freeze_ceiling numeric(14,2)
declare @freeze_yr numeric(4,0)
declare @prev_yr_tax_yr numeric(4,0)
declare @prev_yr_m_n_o_tax_pct numeric(13,10)
declare @prev_yr_i_n_s_tax_pct numeric(13,10)
declare @prev_yr_local_exemption_amt numeric(14,0)
declare @prev_yr_state_exemption_amt numeric(14,0)
declare @prev_yr_land_hstd_val numeric(14,0)
declare @prev_yr_imprv_hstd_val numeric(14,0)
declare @prev_yr_ten_percent_cap numeric(14,0)
declare @local_exemption_amt numeric(14,0)
declare @state_exemption_amt numeric(14,0)
declare @land_hstd_val numeric(14,0)
declare @imprv_hstd_val numeric(14,0)
declare @ten_percent_cap numeric(14,0)
declare @calculated_freeze_assessed_amount numeric(14,0)
declare @calculated_freeze_taxable_amount numeric(14,0)
declare @calculated_freeze_ceiling numeric(14,2)
declare @calculated_freeze_yr numeric(4,0)


declare FREEZES cursor
for
select
	detail.action_indicator,
	detail.action_message,
	detail.report_sort_order,
	detail.prop_id,
	detail.owner_id,
	detail.entity_id,
	detail.tax_yr,
	detail.sup_num,
	detail.freeze_type,
	detail.use_freeze,
	detail.freeze_ceiling,
	detail.freeze_yr,
	detail.prev_yr_tax_yr,
	isnull(detail.prev_yr_m_n_o_tax_pct, 0.0),
	isnull(detail.prev_yr_i_n_s_tax_pct, 0.0),
	isnull(detail.prev_yr_local_exemption_amt, 0),
	isnull(detail.prev_yr_state_exemption_amt, 0),
	isnull(detail.prev_yr_land_hstd_val, 0),
	isnull(detail.prev_yr_imprv_hstd_val, 0),
	isnull(detail.prev_yr_ten_percent_cap, 0),
	isnull(detail.local_exemption_amt, 0),
	isnull(detail.state_exemption_amt, 0),
	isnull(detail.land_hstd_val, 0),
	isnull(detail.imprv_hstd_val, 0),
	isnull(detail.ten_percent_cap, 0),
	detail.calculated_freeze_assessed_amount,
	detail.calculated_freeze_taxable_amount,
	detail.calculated_freeze_ceiling,
	detail.calculated_freeze_yr
from
	freeze_ceiling_run as fcr
inner join
	freeze_ceiling_newly_approved_entity_freeze_ceiling_run_detail as detail
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator in (2, 3)
and	detail.calculated_freeze_assessed_amount is null
and	detail.calculated_freeze_taxable_amount is null
and	detail.calculated_freeze_ceiling is null
and	detail.calculated_freeze_ceiling is null
where
	fcr.run_id = @run_id
for update of
	detail.action_indicator,
	detail.action_message,
	detail.report_sort_order,
	detail.calculated_freeze_assessed_amount,
	detail.calculated_freeze_taxable_amount,
	detail.calculated_freeze_ceiling,
	detail.calculated_freeze_yr



open FREEZES
fetch next from FREEZES
into
	@action_indicator,
	@action_message,
	@report_sort_order,
	@prop_id,
	@owner_id,
	@entity_id,
	@tax_yr,
	@sup_num,
	@freeze_type,
	@use_freeze,
	@freeze_ceiling,
	@freeze_yr,
	@prev_yr_tax_yr,
	@prev_yr_m_n_o_tax_pct,
	@prev_yr_i_n_s_tax_pct,
	@prev_yr_local_exemption_amt,
	@prev_yr_state_exemption_amt,
	@prev_yr_land_hstd_val,
	@prev_yr_imprv_hstd_val,
	@prev_yr_ten_percent_cap,
	@local_exemption_amt,
	@state_exemption_amt,
	@land_hstd_val,
	@imprv_hstd_val,
	@ten_percent_cap,
	@calculated_freeze_assessed_amount,
	@calculated_freeze_taxable_amount,
	@calculated_freeze_ceiling,
	@calculated_freeze_yr


while (@@fetch_status = 0)
begin
	-- Values from current year are not part of the freeze ceiling calcluation . . . to be used for update of prop_owner_entity_val
	set @calculated_freeze_assessed_amount = (@imprv_hstd_val + @land_hstd_val - @ten_percent_cap)
	set @calculated_freeze_taxable_amount = @calculated_freeze_assessed_amount - (@local_exemption_amt + @state_exemption_amt)

	if (@calculated_freeze_taxable_amount < 0)
	begin
		set @calculated_freeze_taxable_amount = 0
	end


	-- Values from the previous year are used for the freeze ceiling calculation.
	declare @freeze_assessed_amount numeric(14,0)
	declare @freeze_taxable_amount numeric(14,0)

	set @freeze_assessed_amount = (@prev_yr_imprv_hstd_val + @prev_yr_land_hstd_val - @prev_yr_ten_percent_cap)
	set @freeze_taxable_amount = @freeze_assessed_amount - (@prev_yr_local_exemption_amt + @prev_yr_state_exemption_amt)

	if (@freeze_taxable_amount < 0)
	begin
		set @freeze_taxable_amount = 0
	end


	declare @freeze_taxable_amount_decimal numeric(14,2)
	set @freeze_taxable_amount_decimal = (@freeze_taxable_amount / 100)


	set @calculated_freeze_ceiling = convert(numeric(14,2), ((@freeze_taxable_amount_decimal * @prev_yr_m_n_o_tax_pct) + (@freeze_taxable_amount_decimal * @prev_yr_i_n_s_tax_pct)))
	
	if (@calculated_freeze_ceiling < 0.0)
	begin
		set @calculated_freeze_ceiling = 0.0
	end


	set @calculated_freeze_yr = @prev_yr_tax_yr


	if ((isnull(@use_freeze, 'F') = 'T') and (isnull(@freeze_ceiling, -1.0) = @calculated_freeze_ceiling) and (isnull(@freeze_yr, -1) = @calculated_freeze_yr))
	begin
		set @action_indicator = 2
		set @action_message = 'Freeze ceiling information unchanged.'
		set @report_sort_order = 820
	end


	update
		freeze_ceiling_newly_approved_entity_freeze_ceiling_run_detail
	set
		action_indicator = @action_indicator,
		action_message = @action_message,
		report_sort_order = @report_sort_order,
		calculated_freeze_assessed_amount = @calculated_freeze_assessed_amount,
		calculated_freeze_taxable_amount = @calculated_freeze_taxable_amount,
		calculated_freeze_ceiling = @calculated_freeze_ceiling,
		calculated_freeze_yr = @calculated_freeze_yr
	where
		current of FREEZES



	fetch next from FREEZES
	into
		@action_indicator,
		@action_message,
		@report_sort_order,
		@prop_id,
		@owner_id,
		@entity_id,
		@tax_yr,
		@sup_num,
		@freeze_type,
		@use_freeze,
		@freeze_ceiling,
		@freeze_yr,
		@prev_yr_tax_yr,
		@prev_yr_m_n_o_tax_pct,
		@prev_yr_i_n_s_tax_pct,
		@prev_yr_local_exemption_amt,
		@prev_yr_state_exemption_amt,
		@prev_yr_land_hstd_val,
		@prev_yr_imprv_hstd_val,
		@prev_yr_ten_percent_cap,
		@local_exemption_amt,
		@state_exemption_amt,
		@land_hstd_val,
		@imprv_hstd_val,
		@ten_percent_cap,
		@calculated_freeze_assessed_amount,
		@calculated_freeze_taxable_amount,
		@calculated_freeze_ceiling,
		@calculated_freeze_yr
end


close FREEZES
deallocate FREEZES

GO

