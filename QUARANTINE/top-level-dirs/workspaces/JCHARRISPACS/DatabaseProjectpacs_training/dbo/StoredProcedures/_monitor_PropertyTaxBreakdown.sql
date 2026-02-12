
CREATE PROCEDURE [dbo].[_monitor_PropertyTaxBreakdown]

/*

{Call _monitor_PropertyTaxBreakdown (2018, 28)} 


This monitor provides the breakdown of taxes by property type: 
Real, Personal or State Assessed Utility by assessment year and sup_num

*/

@year		as numeric(4,0), 
@sup_num	as int

as


SET NOCOUNT ON


select prop_id, prop_val_yr as owner_tax_yr, max(sup_num) sup_num
into #tmp_supp_assoc 
from property_val
where prop_val_yr = @year
and sup_num < @sup_num
group by prop_id, prop_val_yr

select p.prop_type_cd, 
	case when pv.sub_type in ('upp', 'ur') then 'State Assessed'
	else NULL end  as sub_type, SUM(b.initial_amount_due) orig_tax
from property_val pv with(nolock)
join #tmp_supp_assoc psa with(nolock)
	on psa.prop_id = pv.prop_id
	and psa.owner_tax_yr = pv.prop_val_yr
	and psa.sup_num = pv.sup_num
join property p with(nolock)
	on p.prop_id = pv.prop_id
join bill b with(Nolock)
	on b.prop_id = pv.prop_id
	and b.year = pv.prop_val_yr
where b.is_active = 1
and b.display_year = @year + 1--was 2019 changed in TS 215210
and b.bill_type = 'L'
group by p.prop_type_cd, case when pv.sub_type in ('upp', 'ur') then 'State Assessed'
	else NULL end
order by p.prop_type_cd

GO

