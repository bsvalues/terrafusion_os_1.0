
/*

exec dbo.monitor_PreForeclosureListinpayout 2018

*/

create procedure [dbo].[monitor_PreForeclosureListinPayoutstatus]


/*********

--This monitor was written for Benton to provide them a list of properties subject to foreclosure.  
--Properties are subject to foreclosure if no payment has been made toward the year specified OR 
--if any property has a balance due for a year prior to the year specified.  

--This list can be used as a review prior to the foreclosure process.

Requirements from Barb Bader
Question 1:  This query should be returning properties subject to foreclosure and there are 2 situations that will cause a property to be subject to foreclosure. 
1)	If the tax year (display_year) specified has nothing paid to the first half of that year and the first half due date is 4/30 of the tax year.
2)	If the property has any balance due for any year prior to the tax year specified.

Question 2:  The input will be display_year.  Display_year is a computed field based on year (year + 1). 
  I don’t know if it’s easier to build an index on display_year or just calculate year for purposes of the query.


*/

@tax_year	numeric(4,0) 

AS     

SET NOCOUNT ON  

declare @filter_yr numeric(4,0) = @tax_year - 1


select b.prop_id, p.geo_id, p.prop_type_cd, p.col_owner_id, a.file_as_name, b.display_year, b.statement_id, b.code,
sum((b.current_amount_due- b.amount_paid) + (isnull(f.current_amount_due, 0) - isnull(f.amount_paid, 0))) base_due,
isnull(l.cause_num, '') as current_litigation
from bill b with(nolock)
join property p with(nolock)
	on p.prop_id = b.prop_id
join account a with(nolock)
	on a.acct_id = p.col_owner_id
join bill_payments_due bpd with (nolock)  ---new addition
	on b.bill_id = bpd.bill_id 
	and bpd.is_payout_payment = 1
left join bill_fee_assoc bfa with(nolock)
	on bfa.bill_id = b.bill_id
left join fee f with(nolock)
	on f.fee_id = bfa.fee_id
left join litigation_statement_assoc lsa with(nolock)
	on lsa.prop_id = b.prop_id
left join litigation l with(nolock)
	on l.litigation_id = lsa.litigation_id
where  b.[year] = @filter_yr -- ( display_year is a computed column - [year]+(1))  -- old code b.display_year = @tax_year 
and b.is_active = 1
and p.prop_type_cd = 'R'
group by b.prop_id, p.geo_id, p.prop_type_cd, p.col_owner_id, a.file_as_name, b.display_year, b.statement_id, b.code, l.cause_num
having sum(b.current_amount_due - b.amount_paid) > 0
and sum(b.amount_paid) = 0

union ALL

select b.prop_id, p.geo_id, p.prop_type_cd, p.col_owner_id, a.file_as_name, b.display_year, b.statement_id, b.code,
sum((b.current_amount_due- b.amount_paid) + (isnull(f.current_amount_due, 0) - isnull(f.amount_paid, 0))) base_due,
isnull(l.cause_num, '') as current_litigation
from bill b with(nolock)
join property p with(nolock)
	on p.prop_id = b.prop_id
join account a with(nolock)
	on a.acct_id = p.col_owner_id
join bill_payments_due bpd with (nolock)  ---new addition
	on b.bill_id = bpd.bill_id 
	and bpd.is_payout_payment = 1
left join bill_fee_assoc bfa with(nolock)
	on bfa.bill_id = b.bill_id
left join fee f with(nolock)
	on f.fee_id = bfa.fee_id
left join litigation_statement_assoc lsa with(nolock)
	on lsa.prop_id = b.prop_id
left join litigation l with(nolock)
	on l.litigation_id = lsa.litigation_id
where b.[year] < @filter_yr -- ( display_year is a computed column - [year]+(1))  -- old code  b.display_year < @tax_year 
and b.is_active = 1
and p.prop_type_cd = 'R'
group by b.prop_id, p.geo_id, p.prop_type_cd, p.col_owner_id, a.file_as_name, b.display_year, b.statement_id, b.code, l.cause_num
having sum(b.current_amount_due - b.amount_paid) > 0
order by b.prop_id, b.display_year

GO

