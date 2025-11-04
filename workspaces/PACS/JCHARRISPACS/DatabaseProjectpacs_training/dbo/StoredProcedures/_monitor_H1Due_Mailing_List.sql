CREATE PROCEDURE _monitor_H1Due_Mailing_List

/*

This monitor will provide a list of owner IDs, names and addresses of all owners 
that have properties with the first half taxes due for the specified tax year.

{Call _monitor_H1Due_Mailing_List (2019)}

*/

@tax_yr		int

as

set nocount on

select distinct p.col_owner_id, a.file_as_name, ad.addr_line1, ad.addr_line2, ad.addr_line3,
	ad.addr_city, ad.addr_state, ad.addr_zip, ad.country_cd
from property p with(nolock)
join account a with(nolock)
	on a.acct_id = p.col_owner_id
left join address ad with(nolock)
	on ad.acct_id = a.acct_id
	and ad.primary_addr = 'Y'
where p.prop_id in
	(select b.prop_id
	from bill b with(nolock)
	join bill_payments_due bpd with(nolock)
		on bpd.bill_id = b.bill_id
	where b.display_year = @tax_yr
	and bpd.bill_payment_id = 0
	group by b.prop_id
	having SUM(bpd.amount_due - bpd.amount_paid) > 0)
order by a.file_as_name, p.col_owner_id

GO

