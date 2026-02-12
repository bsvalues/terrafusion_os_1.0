
CREATE   procedure IncomeCalculateTax

@income_id	int,
@sup_num	int,
@income_yr	numeric(4),
@ind_value	numeric(14,0),
@output_tax	numeric(14,0) output

AS

/*
 * First determine if this is Texas or Washington, more will need to be
 * added later
 */

declare @tax_rate numeric(13,10)
declare @region varchar(10)
declare @total_levy_rate numeric(13,10)

set @region = 'TX'

select @region = szConfigValue
from core_config
with (nolock)
where szGroup = 'system'
and szConfigName = 'region'

if @region = 'WA'
begin
	-- determine total Levy Rate
	select @total_levy_rate = sum(isnull(l.levy_rate,0))
	from tax_area_fund_assoc as tafa 
	with (nolock)
	join property_tax_area as pta 
	with (nolock) 
	on pta.[year] = tafa.[year]
	and pta.tax_area_id = tafa.tax_area_id
	join income_prop_assoc as ipa 
	with (nolock)
	on pta.[year] = ipa.prop_val_yr
	and pta.sup_num = ipa.sup_num
	and pta.prop_id = ipa.prop_id
	join fund as f 
	with (nolock) 
	on f.[year] = tafa.[year]
	and f.tax_district_id = tafa.tax_district_id
	and f.levy_cd = tafa.levy_cd
	and f.fund_id = tafa.fund_id
	and f.begin_date is not null
	and year(isnull(f.end_date, '1/1/9999')) > f.[year]
	join levy as l
	with (nolock) 
	on l.[year] = tafa.[year]
	and l.tax_district_id = tafa.tax_district_id
	and l.levy_cd = tafa.levy_cd
	and l.primary_fund_number = f.fund_number
	where ipa.income_id = @income_id
	and ipa.sup_num = @sup_num
	and ipa.prop_val_yr = @income_yr

	-- now calculate the income tax amount using the total levy rate
	
	select @output_tax = convert(numeric(14,0), sum(@ind_value * (ipa.income_pct/100) * (@total_levy_rate / 1000)))
	from income_prop_assoc as ipa 
	with (nolock)
	where ipa.income_id = @income_id
	and ipa.sup_num = @sup_num
	and ipa.prop_val_yr = @income_yr
end
else
begin
	select  @output_tax = convert(numeric(14,0), sum((@ind_value/100) * (ipa.income_pct/100) * (IsNull(m_n_o_tax_pct, 0) + IsNull(i_n_s_tax_pct, 0))))
	from income_prop_assoc ipa,
		 entity_prop_assoc epa,
		 tax_rate tr
	where ipa.prop_id     = epa.prop_id
	and   ipa.sup_num     = epa.sup_num
	and   ipa.prop_val_yr = epa.tax_yr
	and   epa.entity_id   = tr.entity_id
	and   (epa.tax_yr-1)  = tr.tax_rate_yr
	and   ipa.income_id   = @income_id
	and   ipa.sup_num     = @sup_num
	and   ipa.prop_val_yr = @income_yr
end

if (@@rowcount = 0)
begin
	set @output_tax = 0
end

GO

