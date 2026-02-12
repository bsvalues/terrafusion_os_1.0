















---here is how you set up the monitor call:  {Call monitor_StatementofTaxesCollected ('1/1/2017', '1/31/2017')}    



/*  



This monitor was created for Benton to mimic the Statement of Taxes Collected but reflect

all voids.



*/



CREATE procedure [dbo].[monitor_StatementofTaxesCollected]          





@begin_date		datetime,

@end_date		datetime          



as          



set nocount on          





--DECLARE @begin_date		AS datetime
--DECLARE @end_date		AS datetime 

--SET @begin_date = '6/28/2018'
--SET @end_date = '7/27/2018'


--drop table #excise

--drop table #fees

--drop table #results
--drop table #tmp
--drop table #tmp_fees

select r.reet_id, r.excise_number, ba.balance_dt, isnull(r.completion_date, @begin_date) as completion_date,

	rr.description, p.payment_id, rtc.mobile_home, COUNT(rip.prop_id) prop_count,

	case when ver.reet_id is not NULL then 1 else 0 end as voided,

	ct.base_amount_pd, ct.interest_amount_pd, ct.penalty_amount_pd,

	ct.overage_amount_pd, ct.underage_amount_pd

into #excise			---(44 row(s) affected)

from reet r with(nolock)

left join voided_excise_reet ver with(nolock)

	on ver.excise_number = r.excise_number

left join reet_import_property rip with(nolock)

	on rip.reet_id = r.reet_id

join reet_type_code rtc with(nolock)

	on rtc.reet_type_cd = r.reet_type_cd

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

group by r.reet_id, r.excise_number, ba.balance_dt, isnull(r.completion_date, @begin_date), rr.description, p.payment_id, 

	rtc.mobile_home, ver.reet_id, ct.base_amount_pd, ct.interest_amount_pd, ct.penalty_amount_pd,

	ct.overage_amount_pd, ct.underage_amount_pd

order by r.excise_number





---changed voided flags on excise that were voided and reissued in the same period



update e set voided = 0

--select r.reet_id, r.excise_number, ba.balance_dt, r.isnull(completion_date, @begin_date)

from reet r with(nolock)

join #excise e 

	on e.excise_number = r.excise_number

join payment p with(nolock)

	on p.payment_id = r.payment_id

join batch ba with(nolock)

	on ba.batch_id = p.batch_id

where ba.balance_dt >= @begin_date

and ba.balance_dt <= @end_date

and e.voided = 1

--and r.reet_id in (10453, 10374)

--and r.excise_number in (129656, 130094)





---reet fees





select r.reet_id, r.excise_number, ba.balance_dt, isnull(r.completion_date, @begin_date) as completion_date, rtc.mobile_home, COUNT(rip.prop_id) prop_count,

	case when ver.reet_id is not NULL then 1 else 0 end as voided,

	f.fee_type_cd, p.payment_id, ct.base_amount_pd, ct.interest_amount_pd, ct.penalty_amount_pd,

	ct.overage_amount_pd, ct.underage_amount_pd

into #fees			---(77 row(s) affected)

from reet r with(nolock)

left join voided_excise_reet ver with(nolock)

	on ver.excise_number = r.excise_number

join reet_import_property rip with(nolock)

	on rip.reet_id = r.reet_id

join reet_type_code rtc with(nolock)

	on rtc.reet_type_cd = r.reet_type_cd

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

group by r.reet_id, r.excise_number, ba.balance_dt, isnull(r.completion_date, @begin_date), f.fee_type_cd, p.payment_id, 

	rtc.mobile_home, ver.reet_id, ct.base_amount_pd, ct.interest_amount_pd, ct.penalty_amount_pd,

	ct.overage_amount_pd, ct.underage_amount_pd

order by fee_type_cd





---changed voided flags on #fees that were voided and reissued in the same period



update e set voided = 0

--select r.reet_id, r.excise_number, ba.balance_dt, r.isnull(completion_date, @begin_date)

from reet r with(nolock)

join #fees e 

	on e.excise_number = r.excise_number

join payment p with(nolock)

	on p.payment_id = r.payment_id

join batch ba with(nolock)

	on ba.batch_id = p.batch_id

where ba.balance_dt >= @begin_date

and ba.balance_dt <= @end_date

and e.voided = 1

--and r.reet_id in (10453, 10374)

--and r.excise_number in (129656, 130094)





---results





create table #results

(

beg_aff				int,

end_aff				int,

aff_count			int,

mh_props			int,

non_mh_paid			numeric(14, 2),

mh_paid				numeric(14, 2),

all_paid			numeric(14, 2),

local_paid			numeric(14, 2),

net_state_paid		numeric(14, 2),

admin_fee			numeric(14, 2),

total_remit 		numeric(14, 2),

penalty				numeric(14, 2),

state_int			numeric(14, 2),

tech_fee			numeric(14, 2),

local_fee			numeric(14, 2),

total_state_remit	numeric(14, 2)

)





---insert beginning and ending affidavit without voided affidavits from #excise



insert into #results

select MIN(excise_number) beg_aff, MAX(excise_number) end_aff, 0 as aff_count,

	0 as mh_props, 0 as non_mh_Paid, 0 as mh_paid, 0 as all_paid, 0 as local_paid,

	0 as net_state_paid, 0 as admin_fee, 0 as total_remit, 0 as penalty, 0 as state_int,

	0 as tech_fee, 0 as local_fee, 0 as total_state_amt

from #excise

where isnull(completion_date, @begin_date) >= @begin_date



---update beg_aff results from #fees where excise_number < lowest excise_number in #excise







update #results

set beg_aff = (select MIN(excise_number) from #fees where isnull(completion_date, @begin_date) >= @begin_date)

from #fees

where (select MIN(excise_number) from #fees where isnull(completion_date, @begin_date) >= @begin_date) < beg_aff











---update end_aff results from #fees where excise_number > highest excise_number in #excise



update #results

set end_aff = (select max(excise_number) from #fees)

from #fees

where (select max(excise_number) from #fees) > end_aff







---update #results with affidavit count with #excise count



update #results

set aff_count = (select COUNT(distinct isnull(excise_number, '')) from #excise where isnull(completion_date, @begin_date) >= @begin_date and excise_number is not NULL)



---add affidavit count from #fees where affidavit  not in #excise 



update #results

set aff_count = (aff_count + 

	(select COUNT(distinct isnull(excise_number, '')) from #fees where isnull(completion_date, @begin_date) >= @begin_date

		and excise_number is not NULL

		and ISNULL(excise_number, '') not in (select isnull(excise_number, '') from #excise)))



		



---update #results mh prop count





select distinct excise_number, prop_count

into #tmp

from #excise 

where isnull(completion_date, @begin_date) >= @begin_date

and mobile_home = 1



		

update #results

set mh_props = isnull((select SUM(prop_count) from #tmp), 0)



---update results with mh prop count from fees





select distinct excise_number, prop_count		---(1 row(s) affected)

into #tmp_fees

from #fees 

where isnull(completion_date, @begin_date) >= @begin_date

and mobile_home = 1

and isnull(excise_number, 0) not in (select isnull(excise_number, 0) from #excise)





update #results

set mh_props = (mh_props + isnull((select SUM(prop_count) from #tmp_fees), 0))



---update #results with non mh excise paid



update #results 

set non_mh_paid = isnull((select SUM(base_amount_pd) from #excise where mobile_home = 0), 0)





--update #results with mh excise paid





update #results 

set mh_paid = isnull((select SUM(base_amount_pd) from #excise where mobile_home = 1), 0)





---update results with total state & local excise paid



update #results 

set all_paid = isnull((select SUM(base_amount_pd) from #excise), 0)





---update results with local excise paid





update #results 

set local_paid = isnull((select SUM(base_amount_pd) from #excise where description like '%local%') , 0)



---update results with next remittance to state



update #results

set net_state_paid = isnull((all_paid - local_paid), 0)



---update results with admin fee



update #results 

set admin_fee = isnull((net_state_paid * .013), 0)





---update result with total remit



update #results

set total_remit = isnull((net_state_paid - admin_fee), 0)



---update result with total penalty



update #results

set penalty = isnull((select SUM(penalty_amount_pd) from #excise), 0)



---update #results with state interest



update #results

set state_int = isnull((select SUM(interest_amount_pd) from #excise where description like '%state%'), 0)



---update #results with total tech fee



update #results

set tech_fee = isnull((select SUM(base_amount_pd) from #fees where fee_type_cd <> 'excfee'), 0)



---update #results with local tech fee



update #results

set local_fee = isnull((select SUM(base_amount_pd) from #fees where fee_type_cd = 'ctfee'), 0)





---update #results with total state remit



update #results

set total_state_remit = (isnull(total_remit, 0) + isnull(penalty, 0) + isnull(state_int, 0) + (isnull(tech_fee, 0) - isnull(local_fee, 0)))



---select #results







select * from #results



set nocount off

GO

