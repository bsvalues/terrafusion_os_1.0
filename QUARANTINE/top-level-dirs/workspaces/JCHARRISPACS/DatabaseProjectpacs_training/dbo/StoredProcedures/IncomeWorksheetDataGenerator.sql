
create procedure IncomeWorksheetDataGenerator

	@dataset_id int,
	@income_id int,
	@income_yr numeric(4,0),
	@sup_num int,
	@mode varchar(20),		-- PRINT = populate global temp tables from income tables for Crystal Report
												-- PRINTEVENT = populate global temp tables from data stored with event
												-- SAVE = populate event-based income data tables
	@event_id int = -1,
	@value_method varchar(10) = ''

as

set nocount on

declare @sql varchar(5000)
declare @worksheet_table varchar(50)
declare @worksheet_property_info_table varchar(50)
declare @worksheet_improvement_info_table varchar(50)
declare @worksheet_land_info_table varchar(50)
declare @worksheet_values_table varchar(50)
declare @worksheet_detail_table varchar(50)
declare @select_dataset_id varchar(50)
declare @select_event_id varchar(50)
declare @id_column varchar(10)

set @id_column = 'dataset_id'

--Now populate the ##income_worksheet table:

if @mode in ('PRINT', 'PRINTEVENT')
begin
	set @worksheet_table = '##income_worksheet'
	set @worksheet_property_info_table = '##income_worksheet_property_info'
	set @worksheet_improvement_info_table = '##income_worksheet_improvement_info'
	set @worksheet_land_info_table = '##income_worksheet_land_info'
	set @worksheet_values_table = '##income_worksheet_values'
	set @worksheet_detail_table = '##income_worksheet_detail'
	
	if len(@value_method) = 0
	begin
		if @mode = 'PRINT'
		begin
			select @value_method = value_method
			from income
			with (nolock)
			where income_yr = @income_yr
			and sup_num = @sup_num
			and income_id = @income_id
		end
		else
		begin
			select @value_method = value_method
			from income_sm_worksheet
			with (nolock)
			where event_id = @event_id
		end
	end
end
else if @mode = 'SAVE'
begin
	set @worksheet_table = 'income_sm_worksheet'
	set @worksheet_property_info_table = 'income_sm_worksheet_property_info'
	set @worksheet_improvement_info_table = 'income_sm_worksheet_improvement_info'
	set @worksheet_land_info_table = 'income_sm_worksheet_land_info'
	set @worksheet_values_table = 'income_sm_worksheet_values'
	set @worksheet_detail_table = 'income_sm_worksheet_detail'
	
	-- When inserting into the *sm* tables, use the event_id column, not the dataset_id column
	set @id_column = 'event_id'
	
	-- setting the @dataset_id = @event_id just makes construction of the SQL statements easier
	set @dataset_id = @event_id
	
	if len(@value_method) = 0
	begin
		select @value_method = value_method
		from income
		with (nolock)
		where income_yr = @income_yr
		and sup_num = @sup_num
		and income_id = @income_id
	end
end


set @select_dataset_id = 'select ' + convert(varchar, @dataset_id) + ', '
set @select_event_id = 'select ' + convert(varchar, @event_id) + ', '



set @sql = 'insert ' + @worksheet_table + '(' + @id_column + '
, income_id, econ_area, property_type, expense_structure, rent_type, class, year_built, [level],
 property_name, stories, comments, value_method, method_value, less_personal_property, leaseup_costs,
 other_value, other_land_value, base_indicated_value, non_income_land_imps_value, total_indicated_value) '

if @mode in ('PRINT', 'SAVE')
begin
	if @mode = 'PRINT'
	begin
		set @sql = @sql + @select_dataset_id
	end
	else
	begin
		set @sql = @sql + @select_event_id
	end
	set @sql = @sql + '
	i.income_id, i.econ_area, i.prop_type_cd, i.expense_structure_cd, i.rent_type_cd, i.class,
	i.yr_blt, i.level_cd, i.prop_name, i.stories, i.comment, '
	
	if @mode = 'SAVE'
	begin
		set @sql = @sql + 'i.value_method'
	end
	else
	begin
		set @sql = @sql + 'ivm.value_method_desc'
	end
	
	set @sql = @sql + ', i.schil_method_value, 
	i.schil_personal_property_value, i.lu_cost, i.schil_other_value, i.other_land_value,
	i.schil_base_indicated_value, i.non_income_land_imps_value, i.schil_indicated_value
from income as i
with (nolock)
join income_value_method as ivm
with (nolock)
on ivm.value_method_cd = ''' + @value_method + '''
where i.income_yr = ' + convert(varchar, @income_yr) + '
and i.sup_num = ' + convert(varchar, @sup_num) + ' 
and i.income_id = ' + convert(varchar, @income_id) + ' '
end
else if @mode = 'PRINTEVENT'
begin
	set @sql = @sql + @select_dataset_id + ' 
	i.income_id, i.econ_area, i.property_type, i.expense_structure, i.rent_type, i.class,
	i.year_built, i.level, i.property_name, i.stories, i.comments, ivm.value_method_desc, i.method_value, 
	i.less_personal_property, i.leaseup_costs, i.other_value, i.other_land_value,
	i.base_indicated_value, i.non_income_land_imps_value, i.total_indicated_value
from income_sm_worksheet as i
with (nolock)
join income_value_method as ivm
with (nolock)
on ivm.value_method_cd = ''' + @value_method + '''
where i.event_id = ' + convert(varchar, @event_id)
end

exec(@sql)

-- Now populate the ##income_worksheet_property_info table:

set @sql = 'insert ' + @worksheet_property_info_table + ' (' + @id_column + '
	, prop_id, owner_name, situs, distribution_pct, [value]) '
	
if @mode in ('PRINT', 'SAVE')
begin
	if @mode = 'PRINT'
	begin
		set @sql = @sql + @select_dataset_id
	end
	else
	begin
		set @sql = @sql + @select_event_id
	end
	set @sql = @sql + 'ipa.prop_id, a.file_as_name, s.situs_display, ipa.income_pct, 
	ipa.income_value
	from income_prop_assoc as ipa
	with (nolock)
	join owner as o
	with (nolock)
	on ipa.prop_val_yr = o.owner_tax_yr
	and ipa.sup_num = o.sup_num
	and ipa.prop_id = o.prop_id
	join account as a
	with (nolock)
	on o.owner_id = a.acct_id
	left outer join situs as s
	with (nolock)
	on ipa.prop_id = s.prop_id
	and s.primary_situs = ''Y''
	where ipa.prop_val_yr = ' + convert(varchar, @income_yr) + '
	and ipa.sup_num = ' + convert(varchar, @sup_num) + '
	and ipa.income_id = ' + convert(varchar, @income_id) + ' '
end
else if @mode = 'PRINTEVENT'
begin
	set @sql = @sql + @select_dataset_id + ' 
	i.prop_id, i.owner_name, i.situs, i.distribution_pct, [value] 
	from income_sm_worksheet_property_info as i
	with (nolock)
	where i.event_id = ' + convert(varchar, @event_id) + ' '
end

exec(@sql)

-- Now populate the ##income_worksheet_improvement_info table:

set @sql = 'insert ' + @worksheet_improvement_info_table + ' (' + @id_column + '
	, imprv_id, imprv_desc'
if @mode = 'SAVE'
begin
	set @sql = @sql + ', included, imprv_type_cd, [value] '
end
set @sql = @sql + ') '
	
if @mode in ('PRINT', 'SAVE')
begin
	if @mode = 'PRINT'
	begin
		set @sql = @sql + @select_dataset_id
	end
	else
	begin
		set @sql = @sql + @select_event_id
	end

	set @sql = @sql + 'iia.imprv_id, i.imprv_desc'
	
	if @mode = 'SAVE'
	begin
		set @sql = @sql + ', iia.included, i.imprv_type_cd, iia.[value]'
	end
	
	set @sql = @sql + ' from income_imprv_assoc as iia
	with (nolock)
	join imprv as i
	with (nolock)
	on iia.income_yr = i.prop_val_yr
	and iia.sup_num = i.sup_num
	and iia.prop_id = i.prop_id
	and iia.imprv_id = i.imprv_id
	and i.sale_id = 0
	where iia.income_yr = ' + convert(varchar, @income_yr) + '
	and iia.sup_num = ' + convert(varchar, @sup_num) + '
	and iia.income_id = ' + convert(varchar, @income_id) + ' '
	
	if @mode = 'PRINT'
	begin
		set @sql = @sql + 'and iia.included = 1 '
	end
end
else if @mode = 'PRINTEVENT'
begin
	set @sql = @sql + @select_dataset_id + '
	i.imprv_id, i.imprv_desc
	from income_sm_worksheet_improvement_info as i
	with (nolock)
	where i.event_id = ' + convert(varchar, @event_id) + ' '
end

exec(@sql)

-- Now populate the ##income_worksheet_land_info table:

set @sql = 'insert ' + @worksheet_land_info_table + ' (' + @id_column + '
	, land_seg_id, prop_id'

if @mode = 'SAVE'
begin
	set @sql = @sql + ', included, land_type_cd, size_acres, [value]'
end
set @sql = @sql + ') '
	
if @mode in ('PRINT', 'SAVE')
begin
	if @mode = 'PRINT'
	begin
		set @sql = @sql + @select_dataset_id
	end
	else
	begin
		set @sql = @sql + @select_event_id
	end
	
	set @sql = @sql + 'ilda.land_seg_id, ilda.prop_id'
	
	if @mode = 'SAVE'
	begin
		set @sql = @sql + ', ilda.included, ld.land_type_cd, ld.size_acres, ilda.[value]'
	end
	
	set @sql = @sql + ' from income_land_detail_assoc as ilda
	with (nolock)
	join land_detail as ld
	with (nolock)
	on ilda.income_yr = ld.prop_val_yr
	and ilda.sup_num = ld.sup_num
	and ilda.sale_id = ld.sale_id
	and ilda.prop_id = ld.prop_id
	and ilda.land_seg_id = ld.land_seg_id
	where ilda.income_yr = ' + convert(varchar, @income_yr) + '
	and ilda.sup_num = ' + convert(varchar, @sup_num) + '
	and ilda.income_id = ' + convert(varchar, @income_id) + ' '
	
	if @mode = 'PRINT'
	begin
		set @sql = @sql + 'and ilda.included = 1 '
	end
end
else if @mode = 'PRINTEVENT'
begin
	set @sql = @sql + @select_dataset_id + '
	i.land_seg_id, i.prop_id
	from income_sm_worksheet_land_info as i
	with (nolock)
	where i.event_id = ' + convert(varchar, @event_id) + ' '
end

exec(@sql)


declare @gba numeric(14,0)
declare @nra numeric(14,0)
declare @nra_percent numeric(5,2)
declare @leased_area numeric(14,0)
declare @occupancy_percent numeric(5,2)
declare @vacant_area numeric(14,0)
declare @vacant_area_percent numeric(5,2)
declare @leased_income numeric(14,0)
declare @leased_income_rate numeric(14,2)
declare @vacant_income numeric(14,0)
declare @vacant_income_rate numeric(14,2)
declare @gross_potential_income numeric(14,0)
declare @gross_potential_income_rate numeric(14,2)
declare @vacancy numeric(14,0)
declare @vacancy_rate numeric(14,2)
declare @vacancy_percent numeric(5,2)
declare @collection_loss numeric(14,0)
declare @collection_loss_rate numeric(14,2)
declare @collection_loss_percent numeric(5,2)
declare @reimbursed_expenses numeric(14,0)
declare @reimbursed_expenses_rate numeric(14,2)
declare @reimbursed_expenses_percent numeric(5,2)
declare @secondary_income numeric(14,0)
declare @secondary_income_rate numeric(14,2)
declare @secondary_income_percent numeric(5,2)
declare @effective_gross_income numeric(14,0)
declare @effective_gross_income_rate numeric(14,2)
declare @effective_gross_income_percent numeric(5,2)
declare @operating_expenses numeric(14,0)
declare @operating_expenses_rate numeric(14,2)
declare @taxes numeric(14,0)
declare @taxes_rate numeric(14,2)
declare @management numeric(14,0)
declare @management_rate numeric(14,2)
declare @management_percent numeric(5,2)
declare @reserve_for_replacement numeric(14,0)
declare @reserve_for_replacement_rate numeric(14,2)
declare @reserve_for_replacement_percent numeric(5,2)
declare @non_recoverable_tenant_imp numeric(14,0)
declare @non_recoverable_tenant_imp_rate numeric(14,2)
declare @non_recoverable_tenant_imp_percent numeric(5,2)
declare @leasing_costs numeric(14,0)
declare @leasing_costs_rate numeric(14,2)
declare @leasing_costs_percent numeric(5,2)
declare @total_expenses numeric(14,0)
declare @total_expenses_rate numeric(14,2)
declare @total_expenses_percent numeric(5,2)
declare @net_operating_income numeric(14,0)
declare @net_operating_income_rate numeric(14,2)
declare @net_operating_income_percent numeric(5,2)
declare @overall_cap_rate numeric(5,2)
declare @sub_total numeric(14,0)
declare @excess_land_value numeric(14,0)
declare @other_personal_property_value numeric(14,0)
declare @other_value numeric(14,0)
declare @leaseup_costs numeric(14,0)
declare @non_income_land_imps numeric(14,0)
declare @other_land_value numeric(14,0)
declare @base_indicated_value numeric(14,0)
declare @indicated_value numeric(14,0)
declare @config_value varchar(1)
declare @seq_num int
declare @dataset_seq_num varchar(50)

set @seq_num = 1

select @config_value = isnull(szConfigValue, 'F')
from pacs_config
with (nolock)
where szGroup = 'Income'
and szConfigName = 'Apply Land & Imprv Designation Distribution to All Methods'

if @value_method in ('DC', 'PF', 'SCH', 'FLAT')
begin
-- Finally, populate the ##income_worksheet_values table.

	/*
	 * First select the appropriate data from the income table
	 */
	 
	if @mode in ('PRINT', 'SAVE')
	begin
		select @gba = gba,
						@nra = nra,
						@nra_percent = case when @value_method = 'DC' then DC_BE
									when @value_method = 'SCH' then SCH_BE
									when @value_method = 'PF' then PF_BE
									else 0
						end,
						@leased_area = case when @value_method = 'DC' then DC_LA
									when @value_method = 'SCH' then SCH_LA
									when @value_method = 'PF' then PF_LA
									else 0
						end,
						@occupancy_percent = case when @value_method = 'DC' then DC_OR
									when @value_method = 'SCH' then SCH_OR
									when @value_method = 'PF' then PF_OR
									else 0
						end,
						@vacant_area = case when @value_method = 'DC' then DC_VA
									when @value_method = 'SCH' then SCH_VA
									when @value_method = 'PF' then PF_VA
									else 0
						end,
						@vacant_area_percent = case when @value_method = 'DC' then DC_VR
									when @value_method = 'SCH' then SCH_VR
									when @value_method = 'PF' then PF_VR
									else 0
						end,
						@leased_income = case when @value_method = 'DC' then DC_LI
									when @value_method = 'SCH' then SCH_LI
									when @value_method = 'PF' then PF_LI
									else 0
						end,
						@leased_income_rate = case when @value_method = 'DC' then DC_LARate
									when @value_method = 'SCH' then SCH_LARate
									when @value_method = 'PF' then PF_LARate
									else 0
						end,
						@vacant_income = case when @value_method = 'DC' then DC_VI
									when @value_method = 'SCH' then SCH_VI
									when @value_method = 'PF' then PF_VI
									else 0
						end,
						@vacant_income_rate = case when @value_method = 'DC' then DC_VARate
									when @value_method = 'SCH' then SCH_VARate
									when @value_method = 'PF' then PF_VARate
									else 0
						end,
						@gross_potential_income = case when @value_method = 'DC' then DC_GPI
									when @value_method = 'SCH' then SCH_GPI
									when @value_method = 'PF' then PF_GPI
									else 0
						end,
						@gross_potential_income_rate = case when @value_method = 'DC' then DC_GPIRSF
									when @value_method = 'SCH' then SCH_GPIRSF
									when @value_method = 'PF' then PF_GPIRSF
									else 0
						end,
						@vacancy = case when @value_method = 'DC' then DC_GPIVI
									when @value_method = 'SCH' then SCH_GPIVI
									when @value_method = 'PF' then PF_GPIVI
									else 0
						end,
						@vacancy_rate = case when @value_method = 'DC' then DC_GPIVRSF
									when @value_method = 'SCH' then SCH_GPIVRSF
									when @value_method = 'PF' then PF_GPIVRSF
									else 0
						end,
						@vacancy_percent = case when @value_method = 'DC' then DC_GPIVR
									when @value_method = 'SCH' then SCH_GPIVR
									when @value_method = 'PF' then PF_GPIVR
									else 0
						end,
						@collection_loss = case when @value_method = 'DC' then DC_GPICLI
									when @value_method = 'SCH' then SCH_GPICLI
									when @value_method = 'PF' then PF_GPICLI
									else 0
						end,
						@collection_loss_rate = case when @value_method = 'DC' then DC_GPICLRSF
									when @value_method = 'SCH' then SCH_GPICLRSF
									when @value_method = 'PF' then PF_GPICLRSF
									else 0
						end,
						@collection_loss_percent = case when @value_method = 'DC' then DC_GPICLR
									when @value_method = 'SCH' then SCH_GPICLR
									when @value_method = 'PF' then PF_GPICLR
									else 0
						end,
						@reimbursed_expenses = case when @value_method = 'DC' then DC_GPIRE
									when @value_method = 'SCH' then SCH_GPIRE
									when @value_method = 'PF' then PF_GPIRE
									else 0
						end,
						@reimbursed_expenses_rate = case when @value_method = 'DC' then DC_GPIRERSF
									when @value_method = 'SCH' then SCH_GPIRERSF
									when @value_method = 'PF' then PF_GPIRERSF
									else 0
						end,
						@reimbursed_expenses_percent = case when @value_method = 'DC' then DC_GPIRER
									when @value_method = 'SCH' then SCH_GPIRER
									when @value_method = 'PF' then PF_GPIRER
									else 0
						end,
						@secondary_income = case when @value_method = 'DC' then DC_GPISI
									when @value_method = 'SCH' then SCH_GPISI
									when @value_method = 'PF' then PF_GPISI
									else 0
						end,
						@secondary_income_rate = case when @value_method = 'DC' then DC_GPISIRSF
									when @value_method = 'SCH' then SCH_GPISIRSF
									when @value_method = 'PF' then PF_GPISIRSF
									else 0
						end,
						@secondary_income_percent = case when @value_method = 'DC' then DC_GPISIR
									when @value_method = 'SCH' then SCH_GPISIR
									when @value_method = 'PF' then PF_GPISIR
									else 0
						end,
						@effective_gross_income = case when @value_method = 'DC' then DC_EGI
									when @value_method = 'SCH' then SCH_EGI
									when @value_method = 'PF' then PF_EGI
									else 0
						end,
						@effective_gross_income_rate = case when @value_method = 'DC' then DC_EGIRSF
									when @value_method = 'SCH' then SCH_EGIRSF
									when @value_method = 'PF' then PF_EGIRSF
									else 0
						end,
						@effective_gross_income_percent = case when @value_method = 'DC' then DC_EGIPCTREV
									when @value_method = 'SCH' then SCH_EGIPCTREV
									when @value_method = 'PF' then PF_EGIPCTREV
									else 0
						end,
						@operating_expenses = case when @value_method = 'DC' then DC_EXPOEI
									when @value_method = 'SCH' then SCH_EXPOEI
									when @value_method = 'PF' then PF_EXPOEI
									else 0
						end,
						@operating_expenses_rate = case when @value_method = 'DC' then DC_EXPOERSF
									when @value_method = 'SCH' then SCH_EXPOERSF
									when @value_method = 'PF' then PF_EXPOERSF
									else 0
						end,
						@taxes = case when @value_method = 'DC' then DC_TAX
									when @value_method = 'SCH' then SCH_TAX
									when @value_method = 'PF' then PF_TAX
									else 0
						end,
						@taxes_rate = case when @value_method = 'DC' then DC_EXPTAXRSF
									when @value_method = 'SCH' then SCH_EXPTAXRSF
									when @value_method = 'PF' then PF_EXPTAXRSF
									else 0
						end,
						@management = case when @value_method = 'DC' then DC_MGMTI
									when @value_method = 'SCH' then SCH_MGMTI
									when @value_method = 'PF' then PF_MGMTI
									else 0
						end,
						@management_rate = case when @value_method = 'DC' then DC_EXPMGMTRSF
									when @value_method = 'SCH' then SCH_EXPMGMTRSF
									when @value_method = 'PF' then PF_EXPMGMTRSF
									else 0
						end,
						@management_percent = case when @value_method = 'DC' then DC_MGMTR
									when @value_method = 'SCH' then SCH_MGMTR
									when @value_method = 'PF' then PF_MGMTR
									else 0
						end,
						@reserve_for_replacement = case when @value_method = 'DC' then DC_RRI
									when @value_method = 'SCH' then SCH_RRI
									when @value_method = 'PF' then PF_RRI
									else 0
						end,
						@reserve_for_replacement_rate = case when @value_method = 'DC' then DC_RRRSF
									when @value_method = 'SCH' then SCH_RRRSF
									when @value_method = 'PF' then PF_RRRSF
									else 0
						end,
						@reserve_for_replacement_percent = case when @value_method = 'DC' then DC_RRR
									when @value_method = 'SCH' then SCH_RRR
									when @value_method = 'PF' then PF_RRR
									else 0
						end,
						@non_recoverable_tenant_imp = case when @value_method = 'DC' then DC_TII
									when @value_method = 'SCH' then SCH_TII
									when @value_method = 'PF' then PF_TII
						end,
						@non_recoverable_tenant_imp_rate = case when @value_method = 'DC' then DC_EXPTIRSF
									when @value_method = 'SCH' then SCH_EXPTIRSF
									when @value_method = 'PF' then PF_EXPTIRSF
						end,
						@non_recoverable_tenant_imp_percent = case when @value_method = 'DC' then DC_TIR
									when @value_method = 'SCH' then SCH_TIR
									when @value_method = 'PF' then PF_TIR
						end,
						@leasing_costs = case when @value_method = 'DC' then DC_LCI
									when @value_method = 'SCH' then SCH_LCI
									when @value_method = 'PF' then PF_LCI
						end,
						@leasing_costs_rate = case when @value_method = 'DC' then DC_EXPLCRSF
									when @value_method = 'SCH' then SCH_EXPLCRSF
									when @value_method = 'PF' then PF_EXPLCRSF
						end,
						@leasing_costs_percent = case when @value_method = 'DC' then DC_LCR
									when @value_method = 'SCH' then SCH_LCR
									when @value_method = 'PF' then PF_LCR
						end,
						@total_expenses = case when @value_method = 'DC' then DC_EXP
									when @value_method = 'SCH' then SCH_EXP
									when @value_method = 'PF' then PF_EXP
						end,
						@total_expenses_rate = case when @value_method = 'DC' then DC_EXPRSF
									when @value_method = 'SCH' then SCH_EXPRSF
									when @value_method = 'PF' then PF_EXPRSF
						end,
						@total_expenses_percent = case when @value_method = 'DC' then DC_EXPPCTREV
									when @value_method = 'SCH' then SCH_EXPPCTREV
									when @value_method = 'PF' then PF_EXPPCTREV
						end,
						@net_operating_income = case when @value_method = 'DC' then DC_NOI
									when @value_method = 'SCH' then SCH_NOI
									when @value_method = 'PF' then PF_NOI
						end,
						@net_operating_income_rate = case when @value_method = 'DC' then DC_NOIRSF
									when @value_method = 'SCH' then SCH_NOIRSF
									when @value_method = 'PF' then PF_NOIRSF
									else 0
						end,
						@net_operating_income_percent = case when @value_method = 'DC' then DC_NOIPCTREV
									when @value_method = 'SCH' then SCH_NOIPCTREV
									when @value_method = 'PF' then PF_NOIPCTREV
									else 0
						end,
						@overall_cap_rate = case when @value_method = 'DC' then DC_CAPR
									when @value_method = 'SCH' then SCH_CAPR
									when @value_method = 'PF' then PF_CAPR
									else 0
						end,
						@sub_total = case when @value_method = 'DC' then DC_CAPI
									when @value_method = 'SCH' then SCH_CAPI
									when @value_method = 'PF' then PF_CAPI
									else 0
						end,
						@excess_land_value = land_excess_value,
						@other_personal_property_value = case when @value_method = 'DC' then DC_PERS
									when @value_method = 'SCH' then SCH_PERS
									when @value_method = 'PF' then PF_PERS
									else 0
						end,
						@leaseup_costs = lu_cost,
						@non_income_land_imps = isnull(non_income_land_imps_value,0),
						@other_land_value = isnull(other_land_value,0),
						@other_value = case when @value_method ='DC' then DC_other_value
									when @value_method = 'SCH' then SCH_other_value
									when @value_method = 'PF' then PF_other_value
									else 0
						end,
						@base_indicated_value = case when @value_method = 'DC' then DC_base_indicated_value
									when @value_method = 'SCH' then SCH_base_indicated_value
									when @value_method = 'PF' then PF_base_indicated_value
									when @value_method = 'FLAT' then flat_value
									else 0
						end,
						@indicated_value = case when @value_method = 'DC' then DC_IND
									when @value_method = 'SCH' then SCH_IND
									when @value_method = 'PF' then PF_IND
									when @value_method = 'FLAT' then flat_value
									else 0
						end
		from income as i
		with (nolock)
		where income_yr = @income_yr
		and sup_num = @sup_num
		and income_id = @income_id

		-- 1
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, description, [value])
		values
		(' + @dataset_seq_num + '''Gross Building Area'', ' + convert(varchar, @gba) + ')'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 2
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''Net Rentable Area'', ' + convert(varchar, @nra) + ', null, ' + 
			convert(varchar, @nra_percent) + ', ''Efficiency'')'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 3
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''Leased Area'', ' + convert(varchar, @leased_area) + ', null, ' +
			convert(varchar, @occupancy_percent) + ', ''Occupancy'')'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 4
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''Vacant Area'', ' + convert(varchar, @vacant_area) + ', null, ' +
			convert(varchar, @vacant_area_percent) + ', ''Vacancy'')'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 5
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''+'', ''Leased Income'', ' + convert(varchar, @leased_income) + ', ' +
			convert(varchar, @leased_income_rate) + ', null, ''Leased Rate'')'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 6
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''+'', ''Vacant Income'', ' + convert(varchar, @vacant_income) + ', ' +
			convert(varchar, @vacant_income_rate) + ', null, ''Vacant Rate'')'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 7
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''='', ''Gross Potential Income'', ' + convert(varchar, @gross_potential_income) + ', ' + 
			convert(varchar, @gross_potential_income_rate) + ', null, ''GPI'')'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 8 blank line
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + 'null, null, null, null)'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 9
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''-'', ''Vacancy'', ' + convert(varchar, @vacancy) + ', ' + 
			convert(varchar, @vacancy_rate) + ', ' + convert(varchar, @vacancy_percent) + ', null)'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 10
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''-'', ''Collection Loss'', ' + convert(varchar, @collection_loss) + ', ' +
			convert(varchar, @collection_loss_rate) + ', ' + convert(varchar, @collection_loss_percent) + ', null)'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 11
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''+'', ''Reimbursed Expenses'', ' + convert(varchar, @reimbursed_expenses) + ', ' +
			convert(varchar, @reimbursed_expenses_rate) + ', ' + convert(varchar, @reimbursed_expenses_percent) + ', null)'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 12
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''+'', ''Secondary Income'', ' + convert(varchar, @secondary_income) + ', ' +
			convert(varchar, @secondary_income_rate) + ', ' + convert(varchar, @secondary_income_percent) + ', null)'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 13
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''='', ''Effective Gross Income'', ' + convert(varchar, @effective_gross_income) + ', ' + 
			convert(varchar, @effective_gross_income_rate) + ', ' + convert(varchar, @effective_gross_income_percent) + ', ''EGI'')'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 14 blank line
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + 'null, null, null, null)'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 15
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''-'', ''Operating Expenses'', ' + convert(varchar, @operating_expenses) + ', ' +
			convert(varchar, @operating_expenses_rate) + ', null, null)'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 16
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''-'', ''Taxes'', ' + convert(varchar, @taxes) + ', ' +
			convert(varchar, @taxes_rate) + ', null, null)'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 17
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''-'', ''Management'', ' + convert(varchar, @management) + ', ' +
			convert(varchar, @management_rate) + ', ' + convert(varchar, @management_percent) + ', null)'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 18
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''-'', ''Reserve For Replacement'', ' + convert(varchar, @reserve_for_replacement) + ', ' +
			convert(varchar, @reserve_for_replacement_rate) + ', ' + convert(varchar, @reserve_for_replacement_percent) + ', null)'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 19
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''-'', ''Non-Recoverable Tenant Imp'', ' + convert(varchar, @non_recoverable_tenant_imp) + ', ' + 
			convert(varchar, @non_recoverable_tenant_imp_rate) + ', ' + convert(varchar, @non_recoverable_tenant_imp_percent) + ', null)'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 20
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''-'', ''Leasing Costs'', ' + convert(varchar, @leasing_costs) + ', ' +
			convert(varchar, @leasing_costs_rate) + ', ' + convert(varchar, @leasing_costs_percent) + ', null)'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 21
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''='', ''Total Expenses'', ' + convert(varchar, @total_expenses) + ', ' + 
			convert(varchar, @total_expenses_rate) + ', ' + convert(varchar, @total_expenses_percent) + ', null)'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 22 blank line
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + 'null, null, null, null)'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 23
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''Net Operating Income'', ' + convert(varchar, @net_operating_income) + ', ' + 
			convert(varchar, @net_operating_income_rate) + ', ' + convert(varchar, @net_operating_income_percent) + ', ''NOI'')'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 24
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''/'', ''Overall Cap Rate'', ' + convert(varchar, @overall_cap_rate) + ', null, null, null)'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 25
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''='', ''Total Method Value'', ' + convert(varchar,@sub_total) + ', null, null, null)'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 26
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''-'', ''Less Personal Property Value'', ' + convert(varchar, @other_personal_property_value) + ', null, null, null)'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 27
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''-'', ''Leaseup Costs'', ' + convert(varchar, @leaseup_costs) + ', null, null, null)'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 28
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''+'', ''Excess Land Value'', ' + convert(varchar, @excess_land_value) + ', null, null, null)'
		
		exec(@sql)
		set @seq_num = @seq_num + 1	

		-- 29
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''+'', ''Other Value'', ' + convert(varchar, @other_value) + ', null, null, null)'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		if @config_value = 'T'
		begin
			-- 30
			set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
			set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
			, seq_num, operator, description, [value], rate, [percent], units)
			values
			(' + @dataset_seq_num + '''-'', ''Other Land Value'', ' + convert(varchar, @other_land_value) + ', null, null, null)'
		
			exec(@sql)
			set @seq_num = @seq_num + 1

			-- 31
			set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
			set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
			, seq_num, operator, description, [value], rate, [percent], units)
			values
			(' + @dataset_seq_num + '''='', ''Indicated Income Value'', ' + convert(varchar, @base_indicated_value) + ', null, null, null)'
		
			exec(@sql)
			set @seq_num = @seq_num + 1

			-- 32
			set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
			set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
			, seq_num, operator, description, [value], rate, [percent], units)
			values
			(' + @dataset_seq_num + '''+'', ''Non-Income Land/Imps'', ' + convert(varchar, @non_income_land_imps) + ', null, null, null)'
		
			exec(@sql)
			set @seq_num = @seq_num + 1
		end

		-- 33
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value], rate, [percent], units)
		values
		(' + @dataset_seq_num + '''='', ''Total Indicated Value'', ' + convert(varchar, @indicated_value) + ', null, null, null)'
		
		exec(@sql)
		set @seq_num = @seq_num + 1
	end
	else if @mode = 'PRINTEVENT'
	begin
		insert ##income_worksheet_values
		(dataset_id, seq_num, operator, description, [value], rate, [percent], units)
		select @dataset_id, seq_num, operator, description, [value], rate, [percent], units
		from income_sm_worksheet_values
		with (nolock)
		where event_id = @event_id
	end
end
else if @value_method = 'SCHIL'
begin
	set @sql = 'insert ' + @worksheet_detail_table + ' (' + @id_column + '
	, seq_num, imprv_id, imprv_det_id, imprv_det_type_cd, imprv_det_type_desc, imprv_det_meth_cd,
	 gross_building_area, net_rentable_area, rent_rate, occupancy_pct, reimbursed_expenses, 
	 secondary_income, gross_potential_income, effective_gross_income, overall_expenses,
	 overall_rate, net_operating_income, [value]) '
	 
	if @mode in ('PRINT', 'SAVE')
	begin
		if @mode = 'PRINT'
		begin
			set @sql = @sql + @select_dataset_id
		end
		else
		begin
			set @sql = @sql + @select_event_id
		end
		set @sql = @sql + 'iild.seq_num, iild.imprv_id, iild.imprv_det_id, iild.imprv_det_type_cd,
			idt.imprv_det_typ_desc, iild.imprv_det_meth_cd, iild.gross_building_area, iild.net_rentable_area,
			iild.yearly_rent_rate, iild.occupancy_pct, iild.reimbursed_expenses, iild.secondary_income,
			iild.gross_potential_income, iild.effective_gross_income, iild.expense_overall,
			iild.overall_rate, iild.net_operating_income, iild.[value]
		from income_improvement_level_detail as iild
		with (nolock)
		join imprv_det_type as idt
		with (nolock)
		on iild.imprv_det_type_cd = idt.imprv_det_type_cd
		where iild.income_yr = ' + convert(varchar, @income_yr) + '
		and iild.sup_num = ' + convert(varchar, @sup_num) + '
		and iild.income_id = ' + convert(varchar, @income_id)
		
		set @sql = @sql + ' and iild.included = 1 '
	end
	else if @mode = 'PRINTEVENT'
	begin
		set @sql = @sql + @select_dataset_id
		set @sql = @sql + 'seq_num, imprv_id, imprv_det_id, imprv_det_type_cd, imprv_det_type_desc, imprv_det_meth_cd,
		 gross_building_area, net_rentable_area, rent_rate, occupancy_pct, reimbursed_expenses, 
		 secondary_income, gross_potential_income, effective_gross_income, overall_expenses,
		 overall_rate, net_operating_income, [value]
		from income_sm_worksheet_detail
		with (nolock)
		where event_id = ' + convert(varchar, @event_id) + ' '
	end
	
	exec(@sql)
end
else if left(@value_method, 1) = 'G'
begin
	if @mode in ('PRINT', 'SAVE')
	begin
		declare @potential_gross_income_annual numeric(14,0)
		declare @potential_gross_income_monthly numeric(14,0)
		declare @gross_income_multiplier numeric(5,2)
		declare @gross_rent_multiplier numeric(5,2)
		declare @indicated_value_grm numeric(14,0)
		declare @indicated_value_gim numeric(14,0)
		
		select @potential_gross_income_annual = case when @value_method = 'GSCH' then igg.sch_pgi_annual
						when @value_method = 'GPF' then igg.pf_pgi_annual
						when @value_method = 'GDC' then igg.dc_pgi_annual
					end,
					@potential_gross_income_monthly = case when @value_method = 'GSCH' then igg.sch_pgi_monthly
						when @value_method = 'GPF' then igg.pf_pgi_monthly
						when @value_method = 'GDC' then igg.dc_pgi_monthly
					end,
					@gross_income_multiplier = case when @value_method= 'GSCH' then igg.sch_gim
						when @value_method = 'GPF' then igg.pf_gim
						when @value_method = 'GDC' then igg.dc_gim
					end,
					@gross_rent_multiplier = case when @value_method = 'GSCH' then igg.sch_grm
						when @value_method = 'GPF' then igg.pf_grm
						when @value_method = 'GDC' then igg.dc_grm
					end,
					@indicated_value_grm = case when @value_method = 'GSCH' then igg.sch_indicated_value_grm
						when @value_method = 'GPF' then igg.pf_indicated_value_grm
						when @value_method = 'GDC' then igg.dc_indicated_value_grm
					end,
					@indicated_value_gim = case when @value_method = 'GSCH' then igg.sch_indicated_value_gim
						when @value_method = 'GPF' then igg.pf_indicated_value_gim
						when @value_method = 'GDC' then igg.dc_indicated_value_gim
					end,
					@other_personal_property_value = case when @value_method = 'GSCH' then igg.sch_personal_property_value
						when @value_method = 'GPF' then igg.pf_personal_property_value
						when @value_method = 'GDC' then igg.dc_personal_property_value
					end,
					@other_value = case when @value_method = 'GSCH' then igg.sch_other_value
						when @value_method = 'GPF' then igg.pf_other_value
						when @value_method = 'GDC' then igg.dc_other_value
					end,
					@leaseup_costs = i.lu_cost,
					@non_income_land_imps = i.non_income_land_imps_value,
					@other_land_value = i.other_land_value,
					@base_indicated_value = case when @value_method = 'GSCH' then igg.sch_base_indicated_value
						when @value_method = 'GPF' then igg.pf_base_indicated_value
						when @value_method = 'GDC' then igg.dc_base_indicated_value
					end,
					@indicated_value = case when @value_method = 'GSCH' then igg.sch_indicated_value
						when @value_method = 'GPF' then igg.pf_indicated_value
						when @value_method = 'GDC' then igg.dc_indicated_value
					end
		from income_grm_gim as igg
		with (nolock)
		join income as i
		with (nolock)
		on igg.income_yr = i.income_yr
		and igg.sup_num = i.sup_num
		and igg.income_id = i.income_id
		where igg.income_yr = @income_yr
		and igg.sup_num = @sup_num
		and igg.income_id = @income_id

		set @seq_num = 1

		-- 1
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, description, [value])
		values
		(' + @dataset_seq_num + '''Potential Gross Income - Annual:'', ' + convert(varchar, @potential_gross_income_annual) + ')'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 2
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, description, [value])
		values
		(' + @dataset_seq_num + '''Potential Gross Income - Monthly:'', ' + convert(varchar, @potential_gross_income_monthly) + ')'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 3
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, description, [value])
		values
		(' + @dataset_seq_num + '''Gross Income Multiplier (GIM):'', ' + convert(varchar, @gross_income_multiplier) + ')'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 4
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, description, [value])
		values
		(' + @dataset_seq_num + '''Gross Rent Multiplier (GRM):'', ' + convert(varchar, @gross_rent_multiplier) + ')'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 5
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, description, [value])
		values
		(' + @dataset_seq_num + '''Indicated Value (GRM):'', ' + convert(varchar, @indicated_value_grm) + ')'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 6
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, description, [value])
		values
		(' + @dataset_seq_num + '''Indicated Value (GIM):'', ' + convert(varchar, @indicated_value_gim) + ')'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 7
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value])
		values
		(' + @dataset_seq_num + '''-'', ''Less Personal Property:'', ' + convert(varchar, @other_personal_property_value) + ')'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 8
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value])
		values
		(' + @dataset_seq_num + '''-'', ''Leaseup Costs:'', ' + convert(varchar, @leaseup_costs) + ')'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 9
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value])
		values
		(' + @dataset_seq_num + '''+'', ''Other Value:'', ' + convert(varchar,@other_value) + ')'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 10
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value])
		values
		(' + @dataset_seq_num + '''-'', ''Other Land Value:'', ' + convert(varchar, @other_land_value) + ')'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 11
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value])
		values
		(' + @dataset_seq_num + '''='', ''Indicated Income Value:'', ' + convert(varchar, @base_indicated_value) + ')'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 12
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value])
		values
		(' + @dataset_seq_num + '''+'', ''Non-Income Land/Imps:'', ' + convert(varchar, @non_income_land_imps) +')'
		
		exec(@sql)
		set @seq_num = @seq_num + 1

		-- 13
		set @dataset_seq_num = convert(varchar, @dataset_id) + ', ' + convert(varchar, @seq_num) + ', '
		set @sql = 'insert ' + @worksheet_values_table + ' (' + @id_column + '
		, seq_num, operator, description, [value])
		values
		(' + @dataset_seq_num + '''='', ''Total Indicated Value:'', ' + convert(varchar, @indicated_value) + ')'
		
		exec(@sql)
	end
	else if @mode = 'PRINTEVENT'
	begin
		insert ##income_worksheet_values
		(dataset_id, seq_num, operator, description, [value])
		
		select @dataset_id, seq_num, operator, description, [value]
		from income_sm_worksheet_values
		with (nolock)
		where event_id = @event_id
	end
end

set nocount off

GO

