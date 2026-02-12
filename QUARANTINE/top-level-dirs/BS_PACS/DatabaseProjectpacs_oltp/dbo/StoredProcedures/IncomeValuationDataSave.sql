
create procedure IncomeValuationDataSave

	@year numeric(4,0),
	@sup_num int,
	@prop_id int,
	@split_merge_id int,
	@split_flag bit,
	@pacs_user_id int

as

declare @income_id int
declare @income_value_method varchar(10)
declare @event_desc varchar(2048)

set @income_id = -1

select @income_id = isnull(ipa.income_id, -1),
			@income_value_method = i.value_method
from income_prop_assoc as ipa
with (nolock)
join income as i
with (nolock)
on ipa.prop_val_yr = i.income_yr
and ipa.sup_num = i.sup_num
and ipa.income_id = i.income_id
where ipa.prop_val_yr = @year
and ipa.sup_num = @sup_num
and ipa.prop_id = @prop_id
and ipa.active_valuation = 'T'

if @income_id > 0
begin
	set nocount on

	set @event_desc = 'Active Income Valuation data for Income ID [' +
		convert(varchar, @income_id) +
		'] with Value Method of [' + @income_value_method + '] Saved prior to '
		
	if @split_flag = 1
	begin
		set @event_desc = @event_desc + 'Split.'
	end
	else
	begin
		set @event_desc = @event_desc + 'Merge.'
	end
	
	
	declare @event_id int

	-- (1) Create an event for the property with the IVDS type code.
	exec GetUniqueID 'event', @event_id output

	insert event
	(event_id, system_type, event_type, event_date, pacs_user, event_desc, ref_evt_type,
	 ref_year, ref_num, ref_id1, ref_id2, ref_id3, pacs_user_id)
	
	select @event_id, 'A', 'IVDS', getdate(), pu.pacs_user_name, 
		@event_desc, @income_value_method,
		@year, @sup_num, @prop_id, @income_id, @split_merge_id, @pacs_user_id
	from pacs_user as pu
	with (nolock)
	where pu.pacs_user_id = @pacs_user_id

	-- (2) Associate event with property

	insert prop_event_assoc
	(prop_id, event_id)
	values
	(@prop_id, @event_id)

	-- (3) Save data for Income Worksheet.  Since the tables are pretty much the
	--			same as the Global Temp table, call IncomeWorksheetDataGenerator with
	--			the @mode parameter = 'SAVE'

	exec IncomeWorksheetDataGenerator -1, @income_id, @year, @sup_num, 'SAVE', @event_id

	-- (4) Save data for the Income Schedule (Improvement Level) Detail Report

	insert income_sm_improvement_level_detail
	(event_id,
		seq_num,
		sup_num,
		income_id,
		prop_id,
		imprv_id,
		imprv_det_id,
		included,
		override,
		copied,
		imprv_det_type_cd,
		imprv_det_meth_cd,	
		floor_number,
		floor_number_override,
		primary_use_cd,
		lease_class,
		effective_year_built,
		gross_building_area,
		gross_building_area_override,
		load_factor,
		load_factor_override,
		net_rentable_area,
		net_rentable_area_override,
		rent_rate,
		rent_rate_override,
		occupancy_pct,
		occupancy_pct_override,
		collection_loss,
		collection_loss_override,
		reimbursed_expenses,
		reimbursed_expenses_override,
		secondary_income,
		secondary_income_override,
		gross_potential_income,
		effective_gross_income,
		expense_ratio,
		expense_ratio_override,
		expense_per_sqft,
		expense_per_sqft_override,
		expense_overall,
		expense_overall_override,
		cap_rate,
		cap_rate_override,
		tax_rate,
		tax_rate_override,
		overall_rate,
		net_operating_income,
		[value],
		imprv_desc
		)
	select @event_id,
		seq_num,
		sup_num,
		income_id,
		prop_id,
		imprv_id,
		imprv_det_id,
		included,
		override,
		copied,
		imprv_det_type_cd,
		imprv_det_meth_cd,	
		floor_number,
		floor_number_override,
		primary_use_cd,
		lease_class,
		effective_year_built,
		gross_building_area,
		gross_building_area_override,
		load_factor,
		load_factor_override,
		net_rentable_area,
		net_rentable_area_override,
		yearly_rent_rate,
		rent_rate_override,
		occupancy_pct,
		occupancy_pct_override,
		collection_loss,
		collection_loss_override,
		reimbursed_expenses,
		reimbursed_expenses_override,
		secondary_income,
		secondary_income_override,
		gross_potential_income,
		effective_gross_income,
		expense_ratio,
		expense_ratio_override,
		expense_per_sqft,
		expense_per_sqft_override,
		expense_overall,
		expense_overall_override,
		cap_rate,
		cap_rate_override,
		tax_rate,
		tax_rate_override,
		overall_rate,
		net_operating_income,
		[value],
		imprv_desc
	from income_improvement_level_detail
	with (nolock)
	where income_yr = @year
	and sup_num = @sup_num
	and income_id = @income_id

	set nocount off
end







set ansi_nulls on
set quoted_identifier on

GO

