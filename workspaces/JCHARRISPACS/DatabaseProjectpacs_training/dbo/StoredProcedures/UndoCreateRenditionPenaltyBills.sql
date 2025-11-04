




create procedure [dbo].[UndoCreateRenditionPenaltyBills]
   @year	numeric(4,0)
with recompile 
as

if not exists
(
	select
		*
	from
		bill
	where
		sup_tax_yr = @year
	and	adjustment_code = 'BPP'
	and	isnull(bill_m_n_o_pd, 0.00) <> 0.00
)
begin
	delete
		bill
	where
		sup_tax_yr = @year
	and	adjustment_code = 'BPP'
	and	isnull(bill_m_n_o_pd, 0.00) = 0.00
	
	
	update	pp_rendition_penalty
	set	create_bills_dt = null
	where	rendition_year = @year

	update
		tax_rate
	set
		bills_created_dt = null
	from
		tax_rate as tr with (nolock)
	inner join
		entity as e with (nolock)
	on
		e.entity_id = tr.entity_id
	and	e.rendition_entity = 1
	where
		tr.tax_rate_yr = @year
end

GO

