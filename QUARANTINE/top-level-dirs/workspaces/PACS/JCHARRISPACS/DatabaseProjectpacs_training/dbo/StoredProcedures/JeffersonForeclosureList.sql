--monitor command to run this monitor -- {call JeffersonForeclosureList( '2010')}
-- client needs to modify the year
-- monitor will find real property that are delinquent in years prior to and including the entered year

CREATE procedure JeffersonForeclosureList

@delq_yr	numeric(4,0)

as

select distinct b.prop_id, b.year, a.file_as_name,
sum(b.initial_amount_due) as 'initial due',
sum(b.current_amount_due - b.amount_paid) as 'current due'
from bill b with (nolock)
inner join bill_payments_due bpd with (nolock)
	on bpd.bill_id = b.bill_id
inner join owner o with (nolock)
	on o.prop_id = b.prop_id
	and o.owner_tax_yr = (select max(tax_yr) from pacs_year)  ---needs to be current assessment year
	and o.sup_num = 0
inner join account a with (nolock)
	on a.acct_id = o.owner_id
where b.display_year <= @delq_yr
and b.current_amount_due - b.amount_paid <> 0
and b.code is NULL
and b.bill_type <> 'R'
and b.bill_id not in (select ab.bill_id from assessment_bill ab with(nolock)
	where ab.bill_id = b.bill_id
	and ab.agency_id in (103,104,105,106,111,113,114,115,116))
group by b.prop_id, b.year, a.file_as_name
order by b.prop_id

GO

