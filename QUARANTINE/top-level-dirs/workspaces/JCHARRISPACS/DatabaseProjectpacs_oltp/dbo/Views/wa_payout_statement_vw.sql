

CREATE VIEW [dbo].[wa_payout_statement_vw]
AS
select 
ISNULL((
	select sum(total_due) as t from wa_payout_amount_due
	where run_id = wps.run_id
	and statement_id = wps.statement_id
),0) as total_due, 

run_id, wps.statement_id, wps.prop_id, addr.acct_id as owner_id, 
addr.file_as_name as owner_name, addr.addr_line1 as owner_addr_line1, 
addr.addr_line2 as owner_addr_line2, addr.addr_line3 as owner_addr_line3,
addr.addr_city as owner_addr_city, addr.addr_state as owner_addr_state, 
addr.zip as owner_addr_zip, isNull(addr.country_cd, 'US') as owner_addr_country,
geo_id, left(legal_desc,175) AS legal_desc, situs_display, detail, term_length, term_type,
bond_interest_rate, remaining_length, next_payment_due, base_amount_due,
bond_interest_balance, delinquent_interest, penalty, total_payoff_amount,
payout_agreement_id, scanline, next_payoff_amount,
tax_statement_id, tax_year, collection_fee, barcode

from wa_payout_statement as wps with (nolock)
join (	select p.prop_id, acct.file_as_name, a.* from property p with (nolock)
		join address a with (nolock)
		on p.col_owner_id = a.acct_id
		join account acct with (nolock)
		on acct.acct_id = a.acct_id
		where isNull(primary_addr, 'N') = 'Y') addr
on addr.prop_id = wps.prop_id

outer apply (
select top 1 bill.statement_id as tax_statement_id, bill.year as tax_year
from bill
join payout_agreement_bill_assoc paba
on paba.bill_id = bill.bill_id
where paba.payout_agreement_id = wps.payout_agreement_id
order by bill.year desc, bill.statement_id desc
) tax_statement_lookup

GO

