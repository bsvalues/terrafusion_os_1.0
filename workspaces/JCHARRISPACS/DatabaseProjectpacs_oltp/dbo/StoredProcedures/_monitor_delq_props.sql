CREATE procedure _monitor_delq_props


/***********
This monitor will return a list of all properties that have missed the half payment specified in the current tax year.  

Inputs are tax year, half payment due date, payment date, half payment
***********/

----------------{Call _monitor_delq_props (2018, '4/30/2018', '5/5/2018', 1)}


@tax_year		int,
@due_date		datetime,
@payment_date	datetime,
@half			int


as

SET NOCOUNT ON


if @half = 1

begin

---puts all 2018 bills into a #tmp table 


select b.prop_id, b.bill_id trans_group_id, b.display_year, bpd.bill_payment_id payment_due_id, bpd.amount_due		--(1674880 row(s) affected)
into #tmp
from bill b with(nolock)
join bill_payments_due bpd with(nolock)
	on bpd.bill_id = b.bill_id
	and bpd.bill_payment_id = 0
where b.display_year = @tax_year
and bpd.due_date <= @due_date


---add all 2018 fees associated with bills

insert into #tmp
select b.prop_id, f.fee_id trans_group_id, f.display_year, fpd.fee_payment_id payment_due_id, fpd.amount_due		---(18449 row(s) affected)
from fee f with(nolock)
join fee_payments_due fpd with(nolock)
	on fpd.fee_id = f.fee_id
	and fpd.fee_payment_id = 0
join bill_fee_assoc bfa with(nolock)
	on bfa.fee_id = f.fee_id
join bill b with(nolock)
	on b.bill_id = bfa.bill_id
where f.display_year = @tax_year
and fpd.due_date <= @due_date

---join coll_transaction


select t.prop_id, t.trans_group_id, t.display_year, t.payment_due_id, t.amount_due, isnull(ct.base_pd, 0) base_pd		---(1693329 row(s) affected)
into #tmp2
from #tmp t with(nolock)
left join 
		(select ct.trans_group_id, pta.payment_due_id, SUM(ct.base_amount_pd) base_pd
		from coll_transaction ct with(nolock)
		join payment_transaction_assoc pta with(nolock)
			on pta.transaction_id = ct.transaction_id
		join batch ba with(nolock)
			on ba.batch_id = ct.batch_id
		where pta.year = (@tax_year - 1)
		and pta.payment_due_id = 0
		and ba.balance_dt <= @payment_date
		group by ct.trans_group_id, pta.payment_due_id) ct
	on ct.trans_group_id = t.trans_group_id
	
-----sum everything up

--select prop_id, display_year, SUM(amount_due - base_pd) H1_due	--6198
--from #tmp2
--group by prop_id, display_year
--having SUM(amount_due - base_pd) > 0
--order by prop_id


---list irrigation district if it exists


select t.prop_id, t.display_year, SUM(t.amount_due - t.base_pd) base_due, isnull(b.assessment_description, 'None') as irrigation_district	--6198
from #tmp2 t
left join (select b.prop_id, b.display_year, saa.assessment_description 
			from bill b with(nolock)
				join assessment_bill ab with(nolock)
					on ab.bill_id = b.bill_id
				join special_assessment_agency saa with(nolock)
					on saa.agency_id = ab.agency_id
					and saa.assessment_type_cd = 'irri') b
	on b.prop_id = t.prop_id
	and b.display_year = t.display_year
group by t.prop_id, t.display_year, b.assessment_description
having SUM(t.amount_due - t.base_pd) > 0
order by prop_id


end

else 

------------second half query.  don't worry about full or half pay in November.  reminder for any 2018 tax still due

select b.prop_id, b.display_year,  SUM(ct.base_amount - ct.base_amount_pd) base_due, ISNULL(ab.assessment_description, 'None') irrigation_district	---4762
from bill b with(nolock)
left join bill_fee_assoc bfa with(nolock)
	on bfa.bill_id = b.bill_id
left join fee f with(nolock)
	on f.fee_id = bfa.fee_id
join coll_transaction ct with(nolock)
	on ct.trans_group_id = b.bill_id
	or ct.trans_group_id = f.fee_id
join batch ba with(nolock)
	on ba.batch_id = ct.batch_id
left join (select b.prop_id, b.display_year, saa.assessment_description 
			from bill b with(nolock)
			join assessment_bill ab with(nolock)
				on ab.bill_id = b.bill_id
			join special_assessment_agency saa with(nolock)
				on saa.agency_id = ab.agency_id
			where b.display_year = @tax_year
			and saa.assessment_cd = 'IRRI') ab
	on ab.prop_id = b.prop_id
	and ab.display_year = b.display_year
where b.display_year = @tax_year
and ba.balance_dt <= @payment_date
group by b.prop_id, b.display_year, ab.assessment_description
having SUM(ct.base_amount - ct.base_amount_pd) > 0

GO

