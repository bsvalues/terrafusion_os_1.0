



CREATE   procedure FreezeTransferCert

@prop_id		int,
@owner_id		int,
@entity_id		int,
@sup_num		int,
@input_yr		numeric(4),
@show_fields		int,
@frz_taxable		numeric(14,0) output,
@frz_actual_tax		numeric(14,2) output,
@frz_tax_wout_ceiling	numeric(14,2) output,
@frz_pct		numeric(8,5)  output

as

set @frz_taxable          = 0
set @frz_actual_tax       = 0
set @frz_tax_wout_ceiling = 0
set @frz_pct		  = 0

declare @frz_assessed	numeric(14,0)
declare @frz_exemption	numeric(14,0)
declare @frz_ceiling	numeric(14,2)
declare @frz_yr		numeric(4)
declare @tax_rate	numeric(13,10)

declare @strSQL		varchar(200)

select
	@tax_rate = isnull(tr.m_n_o_tax_pct + i_n_s_tax_pct, 0)
from
	entity_prop_assoc as epa with (nolock)
join
	entity as e with (nolock)
on
	epa.entity_id = e.entity_id
join
	tax_rate as tr with (nolock)
on
	epa.entity_id = tr.entity_id
and	epa.tax_yr = tr.tax_rate_yr
where
	epa.entity_id = @entity_id
and	epa.prop_id = @prop_id
and	epa.tax_yr = @input_yr
and	epa.sup_num = @sup_num


if (@@rowcount = 0)
begin
	return 0
end


select
	@frz_ceiling = freeze_ceiling,
	@frz_yr = freeze_yr
from
	property_freeze as pf with (nolock)
where	pf.prop_id = @prop_id
and	pf.owner_id = @owner_id
and	pf.entity_id = @entity_id
and	pf.sup_num = @sup_num
and	pf.owner_tax_yr = @input_yr
and	pf.use_freeze = 'T'
and	pf.freeze_ceiling is not null
and	pf.freeze_yr <= @input_yr


if (@@rowcount = 0)
begin
	return 0
end


-- year might be certified, but property may have been supplemented ... so just check to see
-- if the information exists on prop_owner_entity_val table
if not exists
(
	select
		*
	from
		prop_owner_entity_val with (nolock)
	where
		prop_id = @prop_id
	and	owner_id = @owner_id
	and	entity_id = @entity_id
	and	sup_num = @sup_num
	and	sup_yr = @input_yr
)
begin
	set @strSQL = 'CalculateTaxable ''' + convert(varchar(15), @entity_id) + '''' 
	set @strSQL = @strSQL + ', ' + convert(varchar(15), @sup_num)
	set @strSQL = @strSQL + ', ' + convert(varchar(4), @input_yr) 
	set @strSQL = @strSQL + ', ' + convert(varchar(15), @prop_id)

	exec (@strSQL)	
end



select
	@frz_assessed = isnull(imprv_hstd_val,0) + isnull(land_hstd_val,0) - isnull(ten_percent_cap, 0)
from
	prop_owner_entity_val as poev with (nolock)
where
	poev.prop_id = @prop_id
and	poev.owner_id = @owner_id
and	poev.sup_num = @sup_num
and	poev.entity_id = @entity_id
and	poev.sup_yr = @input_yr

if (@@rowcount = 0)
begin
	set @frz_assessed = 0
end



select
	@frz_exemption = isnull(sum(isnull(state_amt, 0) + isnull(local_amt, 0)), 0)
from
	property_entity_exemption as pee with (nolock)
where
	pee.prop_id = @prop_id
and	pee.owner_id = @owner_id
and	pee.sup_num = @sup_num
and	pee.entity_id = @entity_id
and	pee.owner_tax_yr = @input_yr

if (@frz_exemption>@frz_assessed)
BEGIN
   set @frz_exemption = @frz_assessed
END
--
set @frz_taxable = @frz_assessed - @frz_exemption



exec  FreezeCalcActualTax @input_yr,
			  @frz_assessed,
			  @frz_taxable,
			  @frz_ceiling,
			  @frz_yr,
			  @tax_rate,
			  @frz_actual_tax output


set @frz_tax_wout_ceiling = (@frz_taxable / 100) * @tax_rate

if (@frz_tax_wout_ceiling > 0)
begin
	set @frz_pct = (@frz_actual_tax / @frz_tax_wout_ceiling) * 100
end
else
begin
	set @frz_pct = 0
end
	

if (@show_fields = 1)
begin
	select  frz_taxable = @frz_taxable,		
		frz_actual_tax = @frz_actual_tax,		
		frz_tax_wout_ceiling = @frz_tax_wout_ceiling,	
		frz_pct = @frz_pct		
end

GO

