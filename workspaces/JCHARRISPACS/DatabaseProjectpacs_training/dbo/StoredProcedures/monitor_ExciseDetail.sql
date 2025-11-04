



---here is how you set up the monitor call:  {Call ExciseDetail ('1/1/2017', '1/31/2017')}    

/*  

This monitor was created for Benton to mimic the excise detail report but to include all payments
related to REET in a given month including voids.

*/

CREATE procedure [dbo].[monitor_ExciseDetail]          


@begin_date  datetime,
@end_date datetime          

as          

set nocount on          


--drop table #excise
--drop table #fees
--drop table #results
--drop table #tmp2
--drop table #tmp3

---state & local excise

select r.reet_id, r.excise_number, ba.balance_dt, 
	rr.description, p.payment_id, 
	ct.base_amount_pd, ct.interest_amount_pd, ct.penalty_amount_pd,
	ct.overage_amount_pd, ct.underage_amount_pd
into #excise			---(618 row(s) affected)
from reet r with(nolock)
join reet_tax_district_transaction rtdt with(nolock)
	on rtdt.reet_id = r.reet_id
join coll_transaction ct with(nolock)
	on ct.trans_group_id = rtdt.trans_group_id
join reet_rate rr with(nolock)
	on rr.reet_rate_id = rtdt.reet_rate_id
join payment_transaction_assoc pta with(nolock)
	on pta.transaction_id = ct.transaction_id
join payment p with(nolock)
	on p.payment_id = pta.payment_id
join batch ba with(nolock)
	on ba.batch_id = ct.batch_id
where ba.balance_dt >= @begin_date
and ba.balance_dt <= @end_date
--and r.reet_id in (10453, 10374)


---reet fees


select r.reet_id, r.excise_number, ba.balance_dt,
	f.fee_type_cd, p.payment_id, ct.base_amount_pd, ct.interest_amount_pd, ct.penalty_amount_pd,
	ct.overage_amount_pd, ct.underage_amount_pd
into #fees			---(993 row(s) affected)
from reet r with(nolock)
join reet_fee_assoc rfa with(nolock)
	on rfa.reet_id = r.reet_id
join coll_transaction ct with(nolock)
	on ct.trans_group_id = rfa.fee_id
join fee f with(nolock)
	on f.fee_id = rfa.fee_id
join payment_transaction_assoc pta with(nolock)
	on pta.transaction_id = ct.transaction_id
join payment p with(nolock)
	on p.payment_id = pta.payment_id
join batch ba with(nolock)
	on ba.batch_id = ct.batch_id
where ba.balance_dt >= @begin_date
and ba.balance_dt <= @end_date
--and r.reet_id in (10453, 10374)
order by fee_type_cd



---results

create table #results
(
reet_id			int,
excise_number	int,
balance_dt		datetime,
payment_id		int,
state_paid		numeric(14, 2),
local_paid		numeric(14, 2),
state_int		numeric(14, 2),
local_int		numeric(14, 2),
penalty			numeric(14, 2),
tech_fee		numeric(14, 2),
proc_fee		numeric(14, 2),
ovr_under		numeric(14,2)
)


---insert State excise into #results

insert into #results
select reet_id, excise_number, balance_dt, payment_id, base_amount_pd as state_paid, 
	0 as local_paid, interest_amount_pd as state_int, 0 as local_int,
	penalty_amount_pd as penalty, 0 as tech_fee, 0 as proc_fee, (overage_amount_pd - underage_amount_pd) ovr_und
from #excise 
where description like '%state%'
--and reet_id in (10453, 10374)

---update #results with local values

update r 
set local_paid = e.base_amount_pd,
	local_int = e.interest_amount_pd,
	penalty = (penalty + e.penalty_amount_pd),
	ovr_under = (e.overage_amount_pd - e.underage_amount_pd) 
--select r.reet_id, r.excise_number, r.local_paid, e.base_amount_pd,
--	r.local_int, e.interest_amount_pd, r.penalty, e.penalty_amount_pd,
--	r.ovr_under, (e.overage_amount_pd - e.underage_amount_pd) 
from #results r
join #excise e 
	on e.reet_id = r.reet_id
	and e.payment_id = r.payment_id
where description like '%local%'
--and r.reet_id in (10453, 10374)

---update #results with tech fee

select r.reet_id, r.excise_number, r.payment_id, SUM(base_amount_pd) tech
into #tmp2
from #results r
join #fees f
	on f.reet_id = r.reet_id
	and f.payment_id = r.payment_id
where fee_type_cd in ('ctfee', 'stfee')
--and r.reet_id in (10453, 10374)
group by r.reet_id, r.excise_number, r.payment_id

update r set r.tech_fee = t.tech
--select r.reet_id, r.excise_number, r.payment_id, r.tech_fee, t.tech
from #results r
join #tmp2 t
	on t.reet_id = r.reet_id
	and t.payment_id = r.payment_id



---insert #results for excise process fees (exempt transactions)

insert into #results
select reet_id, excise_number, balance_dt, payment_id, 0 as state_paid, 
	0 as local_paid, 0 as state_int, 0 as local_int,
	0 as penalty, 0 as tech_fee, base_amount_pd as proc_fee, (overage_amount_pd - underage_amount_pd) ovr_und
from #fees f
where fee_type_cd = 'excfee'
and abs(base_amount_pd) = 5.00
--and reet_id in (14768)


---update #results for excise process fees where minimum excise (< $10) applies 


update r set r.proc_fee = t.base_amount_pd
--select r.reet_id, r.excise_number, r.payment_id, r.proc_fee, t.base_amount_pd
from #results r
join #fees t
	on t.reet_id = r.reet_id
	and t.payment_id = r.payment_id
where fee_type_cd = 'excfee'
and abs(base_amount_pd) < 5.00

---update #results with tech fees on exempt transactions


select r.reet_id, r.excise_number, r.payment_id, SUM(base_amount_pd) tech
into #tmp3
from #results r
join #fees f
	on f.reet_id = r.reet_id
	and f.payment_id = r.payment_id
where fee_type_cd in ('ctfee', 'stfee')
and f.reet_id in (select reet_id from #fees where fee_type_cd =	'excfee')
--and r.reet_id in (10453, 10374)
group by r.reet_id, r.excise_number, r.payment_id

update r set r.tech_fee = t.tech
--select r.reet_id, r.excise_number, r.payment_id, r.tech_fee, t.tech
from #results r
join #tmp3 t
	on t.reet_id = r.reet_id
	and t.payment_id = r.payment_id
--where r.reet_id in (10453, 10374)

select * from #results
order by excise_number

set nocount off

GO

