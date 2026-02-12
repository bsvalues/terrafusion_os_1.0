CREATE procedure [dbo].[monitor_Parcels_Amount_due]
@year numeric(4,0),
@base_amount1 numeric (14,2),
@base_amount2 numeric (14,2)

as

select b.prop_id, p.prop_type_cd, sum (b.initial_amount_due) as Original_base_tax, sum (b.current_amount_due) as Current_Base_tax
from bill b with (nolock)
join property p with (nolock)
on b.prop_id = p.prop_id
where b.display_year = @year
group by b.prop_id, p.prop_type_cd
having  sum (b.current_amount_due) > = @base_amount1
and sum (b.current_amount_due) < = @base_amount2

GO

