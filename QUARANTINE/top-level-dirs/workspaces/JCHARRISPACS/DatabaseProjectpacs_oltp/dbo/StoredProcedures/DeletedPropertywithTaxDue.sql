 
  
create procedure [dbo].DeletedPropertywithTaxDue   
    
as    
    
SET NOCOUNT ON   
 
select distinct b.prop_id, b.display_year, p.geo_id, a.file_as_name, b.code, p.prop_type_cd,   
sum((b.current_amount_due + isnull(f.current_amount_due, 0)) - (b.amount_paid + isnull(f.amount_paid, 0))) base_due
from bill b with (nolock)  
left join bill_fee_assoc bfa with(nolock)  
on bfa.bill_id = b.bill_id  
left join fee f with(nolock)  
on f.fee_id = bfa.fee_id  
and f.is_active = 1
inner join property p with(nolock) on  
p.prop_id = b.prop_id  
inner join owner o with(nolock) on  
o.prop_id = b.prop_id  
and o.sup_num = b.sup_num  
and o.owner_tax_yr = b.year  
inner join account a with(nolock) on  
a.acct_id = o.owner_id  
left join fee_prop_assoc fpa with(nolock)  
on fpa.fee_id = b.prop_id  
where ((b.current_amount_due + isnull(f.current_amount_due, 0)) - (b.amount_paid + isnull(f.amount_paid, 0))) > 0  
and b.payment_status_type_cd <> 'Payout'  
and b.year <= (select tax_yr from pacs_system)  
and b.is_active = 1  
and b.prop_id in (select prop_id from property_val where prop_val_yr = (select appr_yr from pacs_system)   
  and (prop_inactive_dt is not null or udi_parent = 'F'))  
group by b.prop_id, b.display_year, p.geo_id, a.file_as_name, b.code, p.prop_type_cd
order by b.prop_id, b.display_year

GO

