




CREATE procedure [dbo].[MONITOR_FEE_DLQ_NOTICE_TAXES_WITH_BID_ONLY]


-----ONLY BID Assessment Bill Owing Only - No Other Levy Bills owe taxes

--- This monitor will provide a list of properties that will need to add the $10.00 DLQ NOTICE FEE
--- FOR Props that DO NOT have a Benton Irrigation Dist SA Bill on them that are due
----- {CALL MONITOR_FEE_DLQ_NOTICE_TAXES_WITH_BID_ONLY('2021', '05/01/2022')}



@year numeric (4,0),
@date datetime


as 




select distinct b.prop_id, b.owner_id, b.display_year, max (b.statement_id) as statement_id, ---6018
SUM((b.current_amount_due - b.amount_paid) + (ISNULL(f.current_amount_due, 0) - ISNULL(f.amount_paid, 0))) base_due
from bill b with(nolock)
join assessment_bill ab with (nolock) 
	on b.bill_id = ab.bill_id 
left join prop_supp_assoc psa
	on b.prop_id = psa.prop_id
	and b.sup_num = psa.sup_num 
	and b.year = psa.owner_tax_yr
left join bill_fee_assoc bfa with(nolock)
	on bfa.bill_id = b.bill_id
left join fee f with(Nolock)
	on f.fee_id = bfa.fee_id
where agency_id = 521
and b.prop_id not in (Select fpa.prop_id ---- No fees exist for this type so commenting this section out
		from fee_prop_assoc fpa with (nolock)
		join fee f with (nolock)
		on fpa.fee_id = f.fee_id
		where b.year = @year ---- bill_year not display_year
		and f.fee_type_cd = 'DLQ NOTICE'
		and f.effective_due_date > = @date) 
and b.prop_id not in  (select b.prop_id from bill b
		join levy_bill lb
		on b.bill_id = lb.bill_id
		and b.year = lb.year 
		where b.year = @year
		and ((b.current_amount_due - b.amount_paid) + (ISNULL(f.current_amount_due, 0) - ISNULL(f.amount_paid, 0))) > 0)
and b.year = @year
and b.bill_type not like '%R%' --- exclude the RR bills, this will allow the query to get the max bill for those props that have RB BIlls
and ((b.current_amount_due - b.amount_paid) + (ISNULL(f.current_amount_due, 0) - ISNULL(f.amount_paid, 0))) > 0
group by b.prop_id, b.owner_id, b.display_year, b.statement_id
order by b.prop_id

GO

