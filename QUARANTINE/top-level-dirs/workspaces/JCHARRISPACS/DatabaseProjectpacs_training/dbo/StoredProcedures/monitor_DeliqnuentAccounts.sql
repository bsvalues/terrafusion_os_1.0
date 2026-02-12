


create PROCEDURE [dbo].[monitor_DeliqnuentAccounts]

@year numeric (4,0)

as

SET NOCOUNT ON

select  p.col_owner_id, a.file_as_name, ad.addr_line1, ad.addr_line2, ad.addr_line3,
	ad.addr_city, ad.addr_state, ad.addr_zip, ad.country_cd, sum((b.current_amount_due - b.amount_paid) + 
	(isnull(f.current_amount_due, 0) - isnull(f.amount_paid,0))) base_due
from bill b with(nolock)
join property p
on b.prop_id = p.prop_id
join account a with(nolock)
	on a.acct_id = p.col_owner_id
left join bill_fee_assoc bfa with(nolock)
       on bfa.bill_id = b.bill_id
left join fee f with(nolock)
       on f.fee_id = bfa.fee_id
	   left join address ad with(nolock)
	on ad.acct_id = a.acct_id
	and ad.primary_addr = 'Y'
where b.display_year = 2019
group by b.prop_id, b.display_year, b.statement_id,p.col_owner_id,a.file_as_name, ad.addr_line1, ad.addr_line2, ad.addr_line3,
	ad.addr_city, ad.addr_state, ad.addr_zip, ad.country_cd
having sum((b.current_amount_due - b.amount_paid) + (isnull(f.current_amount_due, 0) - isnull(f.amount_paid,0))) > 0
order by p.col_owner_id

GO

