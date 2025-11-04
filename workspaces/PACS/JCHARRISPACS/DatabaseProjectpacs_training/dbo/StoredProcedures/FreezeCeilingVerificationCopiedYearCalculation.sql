




create procedure FreezeCeilingVerificationCopiedYearCalculation
	@run_id int
as


declare @prop_id int
declare @owner_id int
declare @entity_id int
declare @tax_yr numeric(4,0)
declare @sup_num int
declare @freeze_type varchar(5)
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
	detail.prop_id,
	detail.owner_id,
	detail.entity_id,
	detail.tax_yr,
	detail.sup_num,
	detail.freeze_type,
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
	freeze_ceiling_verification_run_detail as detail
on
	detail.run_id = fcr.run_id
and	detail.tax_yr > fcr.year
and	detail.action_indicator in (2, 3)
and	detail.calculated_freeze_assessed_amount is null
and	detail.calculated_freeze_taxable_amount is null
and	detail.calculated_freeze_ceiling is not null
and	detail.calculated_freeze_yr is not null
where
	fcr.run_id = @run_id
for update of
	detail.calculated_freeze_assessed_amount,
	detail.calculated_freeze_taxable_amount



open FREEZES
fetch next from FREEZES
into
	@prop_id,
	@owner_id,
	@entity_id,
	@tax_yr,
	@sup_num,
	@freeze_type,
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


	update
		freeze_ceiling_verification_run_detail
	set
		calculated_freeze_assessed_amount = @calculated_freeze_assessed_amount,
		calculated_freeze_taxable_amount = @calculated_freeze_taxable_amount
	where
		current of FREEZES



	fetch next from FREEZES
	into
		@prop_id,
		@owner_id,
		@entity_id,
		@tax_yr,
		@sup_num,
		@freeze_type,
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

