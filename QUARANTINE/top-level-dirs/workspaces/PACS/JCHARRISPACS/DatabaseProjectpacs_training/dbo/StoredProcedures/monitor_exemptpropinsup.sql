


---here is how you set up the monitor call:  {Call monitor_exemptpropinsup}    

     



CREATE procedure [dbo].[monitor_exemptpropinsup]



          



        @supgroup numeric(4,0)



as          



             



set nocount on     





select b.prop_id, p.geo_id, b.display_year, b.statement_id,ac.file_as_name,
sum((b.current_amount_due - b.amount_paid) + (isnull(f.current_amount_due, 0) - 
isnull(f.amount_paid,0))) base_due, pv.prop_inactive_dt
from bill b with(nolock)
join supplement s
on s.sup_num = b.sup_num
and s.sup_tax_yr = b.display_year
join property p
on p.prop_id = b.prop_id
join property_val pv
on b.prop_id = pv.prop_id
and b.sup_num = pv.sup_num
and b.year = pv.prop_val_yr
join account ac
on ac.acct_id = p.col_owner_id
join sup_group sg
on sg.sup_group_id = s.sup_group_id
left join bill_fee_assoc bfa with(nolock)
       on bfa.bill_id = b.bill_id
left join fee f with(nolock)
       on f.fee_id = bfa.fee_id
where s.sup_group_id = @supgroup
group by b.prop_id, b.display_year, b.statement_id,p.geo_id, pv.prop_inactive_dt, ac.file_as_name
order by b.prop_id

GO

