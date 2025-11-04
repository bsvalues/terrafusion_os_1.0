




create procedure FreezeCeilingFreezeRefreezeCalculation
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
declare @m_n_o_tax_pct numeric(13,10)
declare @i_n_s_tax_pct numeric(13,10)
declare @local_exemption_amt numeric(14,0)
declare @state_exemption_amt numeric(14,0)
declare @land_hstd_val numeric(14,0)
declare @imprv_hstd_val numeric(14,0)
declare @ten_percent_cap numeric(14,0)
declare @transfer_dt datetime
declare @use_freeze char(1)
declare @freeze_ceiling numeric(14,2)
declare @freeze_yr numeric(4,0)
declare @transfer_pct numeric(9,6)
declare @actual_new_val_hs numeric(14,0)
declare @actual_new_val_nhs numeric(14,0)
declare @actual_new_val_taxable numeric(14,0)
declare @prev_yr_tax_yr numeric(4,0)
declare @prev_yr_m_n_o_tax_pct numeric(13,10)
declare @prev_yr_i_n_s_tax_pct numeric(13,10)
declare @prev_yr_local_exemption_amt numeric(14,0)
declare @prev_yr_state_exemption_amt numeric(14,0)
declare @prev_yr_land_hstd_val numeric(14,0)
declare @prev_yr_imprv_hstd_val numeric(14,0)
declare @prev_yr_ten_percent_cap numeric(14,0)
declare @prev_yr_transfer_dt datetime
declare @prev_yr_freeze_ceiling numeric(14,2)
declare @prev_yr_freeze_yr numeric(4,0)
declare @prev_yr_transfer_pct numeric(9,6)
declare @missing_freeze bit
declare @qualify_year_freeze bit
declare @hs_exemption_refreeze bit
declare @new_value_refreeze bit
declare @transfer_freeze bit
declare @missing_freeze_tax_amount numeric(14,2)
declare @qualify_year_tax_amount numeric(14,2)
declare @hs_exemption_tax_amount numeric(14,2)
declare @new_value_tax_amount numeric(14,2)
declare @transfer_freeze_tax_amount numeric(14,2)
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
	isnull(detail.m_n_o_tax_pct, 0.0),
	isnull(detail.i_n_s_tax_pct, 0.0),
	isnull(detail.local_exemption_amt, 0),
	isnull(detail.state_exemption_amt, 0),
	isnull(detail.land_hstd_val, 0),
	isnull(detail.imprv_hstd_val, 0),
	isnull(detail.ten_percent_cap, 0),
	detail.transfer_dt,
	detail.use_freeze,
	detail.freeze_ceiling,
	detail.freeze_yr,
	detail.transfer_pct,
	isnull(detail.actual_new_val_hs, 0),
	isnull(detail.actual_new_val_nhs, 0),
	isnull(detail.actual_new_val_taxable, 0),
	detail.prev_yr_tax_yr,
	isnull(detail.prev_yr_m_n_o_tax_pct, 0.0),
	isnull(detail.prev_yr_i_n_s_tax_pct, 0.0),
	isnull(detail.prev_yr_local_exemption_amt, 0),
	isnull(detail.prev_yr_state_exemption_amt, 0),
	isnull(detail.prev_yr_land_hstd_val, 0),
	isnull(detail.prev_yr_imprv_hstd_val, 0),
	isnull(detail.prev_yr_ten_percent_cap, 0),
	detail.prev_yr_transfer_dt,
	detail.prev_yr_freeze_ceiling,
	detail.prev_yr_freeze_yr,
	detail.prev_yr_transfer_pct,
	isnull(detail.missing_freeze, 0),
	isnull(detail.qualify_year_freeze, 0),
	isnull(detail.hs_exemption_refreeze, 0),
	isnull(detail.new_value_refreeze, 0),
	isnull(detail.transfer_freeze, 0),
	detail.missing_freeze_tax_amount,
	detail.qualify_year_tax_amount,
	detail.hs_exemption_tax_amount,
	detail.new_value_tax_amount,
	detail.transfer_freeze_tax_amount,
	detail.calculated_freeze_assessed_amount,
	detail.calculated_freeze_taxable_amount,
	detail.calculated_freeze_ceiling,
	detail.calculated_freeze_yr
from
	freeze_ceiling_run as fcr
inner join
	freeze_ceiling_freeze_refreeze_run_detail as detail
on
	detail.run_id = fcr.run_id
and	detail.action_indicator in (2, 3)
and	detail.calculated_freeze_assessed_amount is null
and	detail.calculated_freeze_taxable_amount is null
and	detail.calculated_freeze_ceiling is null
and	detail.calculated_freeze_yr is null
where
	fcr.run_id = @run_id
for update of
	detail.action_indicator,
	detail.action_message,
	detail.report_sort_order,
	detail.missing_freeze_tax_amount,
	detail.qualify_year_tax_amount,
	detail.hs_exemption_tax_amount,
	detail.new_value_tax_amount,
	detail.transfer_freeze_tax_amount,
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
	@m_n_o_tax_pct,
	@i_n_s_tax_pct,
	@local_exemption_amt,
	@state_exemption_amt,
	@land_hstd_val,
	@imprv_hstd_val,
	@ten_percent_cap,
	@transfer_dt,
	@use_freeze,
	@freeze_ceiling,
	@freeze_yr,
	@transfer_pct,
	@actual_new_val_hs,
	@actual_new_val_nhs,
	@actual_new_val_taxable,
	@prev_yr_tax_yr,
	@prev_yr_m_n_o_tax_pct,
	@prev_yr_i_n_s_tax_pct,
	@prev_yr_local_exemption_amt,
	@prev_yr_state_exemption_amt,
	@prev_yr_land_hstd_val,
	@prev_yr_imprv_hstd_val,
	@prev_yr_ten_percent_cap,
	@prev_yr_transfer_dt,
	@prev_yr_freeze_ceiling,
	@prev_yr_freeze_yr,
	@prev_yr_transfer_pct,
	@missing_freeze,
	@qualify_year_freeze,
	@hs_exemption_refreeze,
	@new_value_refreeze,
	@transfer_freeze,
	@missing_freeze_tax_amount,
	@qualify_year_tax_amount,
	@hs_exemption_tax_amount,
	@new_value_tax_amount,
	@transfer_freeze_tax_amount,
	@calculated_freeze_assessed_amount,
	@calculated_freeze_taxable_amount,
	@calculated_freeze_ceiling,
	@calculated_freeze_yr


while (@@fetch_status = 0)
begin
	set @calculated_freeze_assessed_amount = (@imprv_hstd_val + @land_hstd_val - @ten_percent_cap)
	set @calculated_freeze_taxable_amount = @calculated_freeze_assessed_amount - (@local_exemption_amt + @state_exemption_amt)

	if (@calculated_freeze_taxable_amount < 0)
	begin
		set @calculated_freeze_taxable_amount = 0
	end


	if (@missing_freeze = 1)
	begin
		set @missing_freeze_tax_amount = @prev_yr_freeze_ceiling
	end

	if ((@missing_freeze = 0) and ((@qualify_year_freeze = 1) or (@hs_exemption_refreeze = 1)))
	begin
		declare @prev_yr_freeze_assessed_amount numeric(14,0)
		declare @prev_yr_freeze_taxable_amount numeric(14,0)

		set @prev_yr_freeze_assessed_amount = (@prev_yr_imprv_hstd_val + @prev_yr_land_hstd_val - @prev_yr_ten_percent_cap)
		set @prev_yr_freeze_taxable_amount = @prev_yr_freeze_assessed_amount - (@prev_yr_local_exemption_amt + @prev_yr_state_exemption_amt)
	
		if (@prev_yr_freeze_taxable_amount < 0)
		begin
			set @prev_yr_freeze_taxable_amount = 0
		end
	
	
		declare @prev_yr_freeze_taxable_amount_decimal numeric(14,2)
		set @prev_yr_freeze_taxable_amount_decimal = (@prev_yr_freeze_taxable_amount / 100)
	
	
		set @qualify_year_tax_amount = convert(numeric(14,2), ((@prev_yr_freeze_taxable_amount_decimal * @prev_yr_m_n_o_tax_pct) + (@prev_yr_freeze_taxable_amount_decimal * @prev_yr_i_n_s_tax_pct)))

		
		if ((@prev_yr_transfer_dt is not null) and (datepart(yyyy, @prev_yr_transfer_dt) = @prev_yr_tax_yr) and (@prev_yr_transfer_pct is not null))
		begin
			set @qualify_year_tax_amount = (@qualify_year_tax_amount * (@prev_yr_transfer_pct / 100))
		end
		

		if (@qualify_year_tax_amount < 0.0)
		begin
			set @qualify_year_tax_amount = 0.0
		end
	end

	
	if ((@missing_freeze = 0) and (@hs_exemption_refreeze = 1))
	begin
		declare @freeze_assessed_without_new_value_amount numeric(14,0)
		declare @freeze_taxable_without_new_value_amount numeric(14,0)

		set @freeze_assessed_without_new_value_amount = (@calculated_freeze_assessed_amount - @actual_new_val_hs)
		set @freeze_taxable_without_new_value_amount = @freeze_assessed_without_new_value_amount - (@local_exemption_amt + @state_exemption_amt)
	
		if (@freeze_taxable_without_new_value_amount < 0)
		begin
			set @freeze_taxable_without_new_value_amount = 0
		end
	
	
		declare @freeze_taxable_without_new_value_amount_decimal numeric(14,2)
		set @freeze_taxable_without_new_value_amount_decimal = (@freeze_taxable_without_new_value_amount / 100)
	
	
		set @hs_exemption_tax_amount = convert(numeric(14,2), ((@freeze_taxable_without_new_value_amount_decimal * @m_n_o_tax_pct) + (@freeze_taxable_without_new_value_amount_decimal * @i_n_s_tax_pct)))
		
		if (@hs_exemption_tax_amount < 0.0)
		begin
			set @hs_exemption_tax_amount = 0.0
		end
	end


	if ((@new_value_refreeze = 1) and (@transfer_freeze = 0))
	begin
		declare @new_val_hs_taxable_decimal numeric(14,2)
		set @new_val_hs_taxable_decimal = convert(numeric(14,2), ((@actual_new_val_taxable - @actual_new_val_nhs) / 100))

		set @new_value_tax_amount = ((@new_val_hs_taxable_decimal * @m_n_o_tax_pct) + (@new_val_hs_taxable_decimal * @i_n_s_tax_pct))

		if (@new_value_tax_amount < 0.0)
		begin
			set @new_value_tax_amount = 0.0
		end
	end

	if ((@missing_freeze = 0) and (@qualify_year_freeze = 0) and (@hs_exemption_refreeze = 0) and (@transfer_freeze = 1))
	begin
		declare @freeze_taxable_amount_decimal numeric(14,2)
		set @freeze_taxable_amount_decimal = (@calculated_freeze_taxable_amount / 100)
	
		set @transfer_freeze_tax_amount = convert(numeric(14,2), ((@freeze_taxable_amount_decimal * @m_n_o_tax_pct) + (@freeze_taxable_amount_decimal * @i_n_s_tax_pct)))
		
		if ((@transfer_dt is not null) and (datepart(yyyy, @transfer_dt) = @tax_yr) and (@transfer_pct is not null))
		begin
			set @transfer_freeze_tax_amount = (@transfer_freeze_tax_amount * (@transfer_pct / 100))
		end

		if (@transfer_freeze_tax_amount < 0.0)
		begin
			set @transfer_freeze_tax_amount = 0.0
		end
	end

	-- Default (in case @new_value_refreeze is the only option)
	if (@new_value_refreeze = 1)
	begin
		set @calculated_freeze_ceiling = @prev_yr_freeze_ceiling
		set @calculated_freeze_yr = @prev_yr_freeze_yr
	end


	if (@missing_freeze = 1)
	begin
		set @calculated_freeze_ceiling = @missing_freeze_tax_amount
		set @calculated_freeze_yr = @prev_yr_freeze_yr
	end

	if (@qualify_year_freeze = 1)
	begin
		set @calculated_freeze_ceiling = @qualify_year_tax_amount

		if ((@hs_exemption_refreeze = 1) and (@hs_exemption_tax_amount < @calculated_freeze_ceiling))
		begin
			set @calculated_freeze_ceiling = @hs_exemption_tax_amount
		end

		set @calculated_freeze_yr = @prev_yr_tax_yr
	end

	if ((@new_value_refreeze = 1) and (@transfer_freeze = 0))
	begin
		set @calculated_freeze_ceiling = (@calculated_freeze_ceiling + @new_value_tax_amount)
	end

	if (@transfer_freeze = 1)
	begin
		set @calculated_freeze_ceiling = @transfer_freeze_tax_amount
		set @calculated_freeze_yr = @tax_yr
	end


	if ((isnull(@use_freeze, 'F') = 'T') and (isnull(@freeze_ceiling, -1.0) = @calculated_freeze_ceiling) and (isnull(@freeze_yr, -1) = @calculated_freeze_yr))
	begin
		set @action_indicator = 2
		set @action_message = 'Freeze ceiling information unchanged.'
		set @report_sort_order = 820
	end


	update
		freeze_ceiling_freeze_refreeze_run_detail
	set
		action_indicator = @action_indicator,
		action_message = @action_message,
		report_sort_order = @report_sort_order,
		missing_freeze_tax_amount = @missing_freeze_tax_amount,
		qualify_year_tax_amount = @qualify_year_tax_amount,
		hs_exemption_tax_amount = @hs_exemption_tax_amount,
		new_value_tax_amount = @new_value_tax_amount,
		transfer_freeze_tax_amount = @transfer_freeze_tax_amount,
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
		@m_n_o_tax_pct,
		@i_n_s_tax_pct,
		@local_exemption_amt,
		@state_exemption_amt,
		@land_hstd_val,
		@imprv_hstd_val,
		@ten_percent_cap,
		@transfer_dt,
		@use_freeze,
		@freeze_ceiling,
		@freeze_yr,
		@transfer_pct,
		@actual_new_val_hs,
		@actual_new_val_nhs,
		@actual_new_val_taxable,
		@prev_yr_tax_yr,
		@prev_yr_m_n_o_tax_pct,
		@prev_yr_i_n_s_tax_pct,
		@prev_yr_local_exemption_amt,
		@prev_yr_state_exemption_amt,
		@prev_yr_land_hstd_val,
		@prev_yr_imprv_hstd_val,
		@prev_yr_ten_percent_cap,
		@prev_yr_transfer_dt,
		@prev_yr_freeze_ceiling,
		@prev_yr_freeze_yr,
		@prev_yr_transfer_pct,
		@missing_freeze,
		@qualify_year_freeze,
		@hs_exemption_refreeze,
		@new_value_refreeze,
		@transfer_freeze,
		@missing_freeze_tax_amount,
		@qualify_year_tax_amount,
		@hs_exemption_tax_amount,
		@new_value_tax_amount,
		@transfer_freeze_tax_amount,
		@calculated_freeze_assessed_amount,
		@calculated_freeze_taxable_amount,
		@calculated_freeze_ceiling,
		@calculated_freeze_yr
end


close FREEZES
deallocate FREEZES

GO

