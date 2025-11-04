
 
create procedure [dbo].[Monitor_SupInfoandDeleteDate]
 
@supgroup int
 
as
 
SET NOCOUNT ON
 



select b.prop_id, p.geo_id,pv.prop_val_yr,ac.file_as_name, pv.prop_inactive_dt, sum((b.current_amount_due - b.amount_paid) + (isnull(f.current_amount_due, 0) - isnull(f.amount_paid,0))) base_due
from bill b with(nolock)
join property p 
on b.prop_id = p.prop_id
join property_val pv 
on p.prop_id = pv.prop_id
join account ac with (nolock)
on p.col_owner_id = ac.acct_id
join supplement s with(nolock)
on s.sup_tax_yr = pv.prop_val_yr
and s.sup_num = pv.sup_num
--join prop_supp_assoc ps
--on pv.prop_id = ps.prop_id
left join bill_fee_assoc bfa with(nolock)
       on bfa.bill_id = b.bill_id
left join fee f with(nolock)
       on f.fee_id = bfa.fee_id
where s.sup_group_id = @supgroup
group by b.prop_id, pv.prop_val_yr, b.statement_id, p.geo_id, pv.prop_inactive_dt, ac.file_as_name
order by b.prop_id

GO

