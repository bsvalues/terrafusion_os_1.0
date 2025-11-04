 
 
 
 
---here is how you set up the monitor call:  {Call PaidAssessments_list ('1/1/2017', '1/31/2017', '521, 522, 523, 524')}    
 
CREATE procedure [dbo].[PaidAssessments_list]          
 
 
@begin_date  datetime,
@end_date datetime,
 
 
 
@ids varchar(255)
 
 
 
as          
 
 
set nocount on        
 
 
---set the table variable to hold the @ids list
 
declare @id_list table (agency_id varchar(255))
 
---use function to separate the comma delimited list into separate values and insert values into table
 
 
insert into @id_list
select 
 csp.id as agency_id
 from 
 fn_ReturnTableFromCommaSepValues(@ids) as csp
 
 
-----PAYMENTS
 
select distinct p.prop_id, p.geo_id,
 saa.assessment_description,
 b.display_year, 
 ba.balance_dt, 
 'PAYMENT' as type,
 pta.payment_id as ID, 
 sum(ct.base_amount_pd) assm_base_pd,
 sum(ct.interest_amount_pd) assm_int_pd,
 sum(ct.penalty_amount_pd) assm_pen_pd,
 SUM(ct.overage_amount_pd - ct.underage_amount_pd) bill_over_short
into #assm_bill_pd
from bill b with(nolock)
join property p with(nolock)
 on p.prop_id = b.prop_id
join assessment_bill ab with(nolock)
 on ab.bill_id = b.bill_id
join special_assessment_agency as saa with(nolock)
 on saa.agency_id = ab.agency_id
join @id_list t
 on t.agency_id = saa.agency_id
join coll_transaction ct with(nolock)
 on ct.trans_group_id = b.bill_id
join trans_group tg with(nolock)
 on tg.trans_group_id = ct.trans_group_id
join payment_transaction_assoc pta with(nolock)
 on pta.transaction_id = ct.transaction_id
join batch ba with(nolock)
 on ba.batch_id = ct.batch_id
where tg.trans_group_type = 'AB'
and ba.balance_dt >= @begin_date 
and ba.balance_dt <= @end_date
--and p.geo_id = '112964010660003           '
group by p.prop_id,  p.geo_id, saa.assessment_description, b.display_year,  ba.balance_dt,  pta.payment_id
 
 
 
select distinct p.prop_id, p.geo_id,
 ft.fee_type_desc,
 f.display_year, 
 ba.balance_dt, 
 'PAYMENT' as type,
 pta.payment_id as ID, 
 sum(ct.base_amount_pd) fee_base_pd,
 sum(ct.interest_amount_pd) fee_int_pd,
 sum(ct.penalty_amount_pd) fee_pen_pd,
 SUM(ct.overage_amount_pd - ct.underage_amount_pd) fee_over_short
into #icc_pd
from coll_transaction ct with(nolock)
join fee f with(nolock)
 on f.fee_id = ct.trans_group_id
join fee_type ft with(nolock)
 on ft.fee_type_cd = f.fee_type_cd
join fee_prop_assoc fpa with(Nolock)
 on fpa.fee_id = f.fee_id
join property p with(nolock)
 on fpa.prop_id = p.prop_id
join trans_group tg with(nolock)
 on tg.trans_group_id = ct.trans_group_id
join payment_transaction_assoc pta with(nolock)
 on pta.transaction_id = ct.transaction_id
join batch ba with(nolock)
 on ba.batch_id = ct.batch_id
where tg.trans_group_type = 'F'
and ba.balance_dt >= @begin_date 
and ba.balance_dt <= @end_date
and f.fee_type_cd = 'ICC'
--and p.geo_id = '112964010660003           '
group by p.prop_id,  p.geo_id, ft.fee_type_desc, f.display_year,  pta.payment_id, ba.balance_dt
 
 
select distinct p.prop_id, p.geo_id,
 ft.fee_type_desc,
 f.display_year, 
 ba.balance_dt, 
 'PAYMENT' as type,
 pta.payment_id as ID, 
 sum(ct.base_amount_pd) fee_base_pd,
 sum(ct.interest_amount_pd) fee_int_pd,
 sum(ct.penalty_amount_pd) fee_pen_pd,
 SUM(ct.overage_amount_pd - ct.underage_amount_pd) fee_over_short
into #ircc_pd
from coll_transaction ct with(nolock)
join fee f with(nolock)
 on f.fee_id = ct.trans_group_id
join fee_type ft with(nolock)
 on ft.fee_type_cd = f.fee_type_cd
join fee_prop_assoc fpa with(Nolock)
 on fpa.fee_id = f.fee_id
join property p with(nolock)
 on fpa.prop_id = p.prop_id
join trans_group tg with(nolock)
 on tg.trans_group_id = ct.trans_group_id
join payment_transaction_assoc pta with(nolock)
 on pta.transaction_id = ct.transaction_id
join batch ba with(nolock)
 on ba.batch_id = ct.batch_id
where tg.trans_group_type = 'F'
and ba.balance_dt >= @begin_date 
and ba.balance_dt <= @end_date
and f.fee_type_cd = 'IRCC'
--and p.geo_id = '112964010660003           '
group by p.prop_id,  p.geo_id, ft.fee_type_desc, f.display_year,  pta.payment_id, ba.balance_dt
 
select distinct p.prop_id, p.geo_id,
 ft.fee_type_desc,
 f.display_year, 
 ba.balance_dt, 
 'PAYMENT' as type,
 pta.payment_id as ID, 
 sum(ct.base_amount_pd) fee_base_pd,
 sum(ct.interest_amount_pd) fee_int_pd,
 sum(ct.penalty_amount_pd) fee_pen_pd,
 SUM(ct.overage_amount_pd - ct.underage_amount_pd) fee_over_short
into #irrcc_pd
from coll_transaction ct with(nolock)
join fee f with(nolock)
 on f.fee_id = ct.trans_group_id
join fee_type ft with(nolock)
 on ft.fee_type_cd = f.fee_type_cd
join fee_prop_assoc fpa with(Nolock)
 on fpa.fee_id = f.fee_id
join property p with(nolock)
 on fpa.prop_id = p.prop_id
join trans_group tg with(nolock)
 on tg.trans_group_id = ct.trans_group_id
join payment_transaction_assoc pta with(nolock)
 on pta.transaction_id = ct.transaction_id
--join payment pmt with (nolock)
--on pta.payment_id = pmt.payment_id
join batch ba with(nolock)
 on ba.batch_id = ct.batch_id
where tg.trans_group_type = 'F'
and ba.balance_dt >= @begin_date 
and ba.balance_dt <= @end_date
and f.fee_type_cd = 'IRRCC'
--and p.geo_id = '112964010660003           '
group by p.prop_id,  p.geo_id, ft.fee_type_desc, f.display_year,  pta.payment_id, ba.balance_dt
 
 
select distinct p.prop_id, p.geo_id,
 ft.fee_type_desc,
 f.display_year, 
 ba.balance_dt, 
 'PAYMENT' as type,
 pta.payment_id as ID, 
 sum(ct.base_amount_pd) fee_base_pd,
 sum(ct.interest_amount_pd) fee_int_pd,
 sum(ct.penalty_amount_pd) fee_pen_pd,
 SUM(ct.overage_amount_pd - ct.underage_amount_pd) fee_over_short
into #irrdl_pd
from coll_transaction ct with(nolock)
join fee f with(nolock)
 on f.fee_id = ct.trans_group_id
join fee_type ft with(nolock)
 on ft.fee_type_cd = f.fee_type_cd
join fee_prop_assoc fpa with(Nolock)
 on fpa.fee_id = f.fee_id
join property p with(nolock)
 on fpa.prop_id = p.prop_id
join trans_group tg with(nolock)
 on tg.trans_group_id = ct.trans_group_id
join payment_transaction_assoc pta with(nolock)
 on pta.transaction_id = ct.transaction_id
join batch ba with(nolock)
 on ba.batch_id = ct.batch_id
where tg.trans_group_type = 'F'
and ba.balance_dt >= @begin_date 
and ba.balance_dt <= @end_date
and f.fee_type_cd = 'IRRDL'
--and p.geo_id = '112964010660003           '
group by p.prop_id,  p.geo_id, ft.fee_type_desc, f.display_year,  pta.payment_id, ba.balance_dt
 
 
 
-------REFUNDS
 
 
select distinct p.prop_id, p.geo_id,
 saa.assessment_description,
 b.display_year, 
 ba.balance_dt, 
 'REFUND' as type,
 pta.refund_id as ID, 
 sum(ct.base_amount_pd) assm_base_ref,
 sum(ct.interest_amount_pd) assm_int_ref,
 sum(ct.penalty_amount_pd) assm_pen_ref,
 SUM(ct.overage_amount_pd - ct.underage_amount_pd) bill_over_short
into #assm_bill_ref
from bill b with(nolock)
join property p with(nolock)
 on p.prop_id = b.prop_id
join assessment_bill ab with(nolock)
 on ab.bill_id = b.bill_id
join special_assessment_agency as saa with(nolock)
 on saa.agency_id = ab.agency_id
join @id_list t
 on t.agency_id = saa.agency_id
join coll_transaction ct with(nolock)
 on ct.trans_group_id = b.bill_id
join trans_group tg with(nolock)
 on tg.trans_group_id = ct.trans_group_id
join refund_transaction_assoc pta with(nolock)
 on pta.transaction_id = ct.transaction_id
join batch ba with(nolock)
 on ba.batch_id = ct.batch_id
where tg.trans_group_type = 'AB'
and ba.balance_dt >= @begin_date 
and ba.balance_dt <= @end_date
--and p.geo_id = '112964010660003           '
group by p.prop_id,  p.geo_id, saa.assessment_description, b.display_year,  ba.balance_dt,  pta.refund_id
 
 
 
select distinct p.prop_id, p.geo_id,
 ft.fee_type_desc,
 f.display_year, 
 ba.balance_dt, 
 'REFUND' as type,
 pta.refund_id as ID, 
 sum(ct.base_amount_pd) fee_base_ref,
 sum(ct.interest_amount_pd) fee_int_ref,
 sum(ct.penalty_amount_pd) fee_pen_ref,
 SUM(ct.overage_amount_pd - ct.underage_amount_pd) fee_over_short
into #icc_ref
from coll_transaction ct with(nolock)
join fee f with(nolock)
 on f.fee_id = ct.trans_group_id
join fee_type ft with(nolock)
 on ft.fee_type_cd = f.fee_type_cd
join fee_prop_assoc fpa with(Nolock)
 on fpa.fee_id = f.fee_id
join property p with(nolock)
 on fpa.prop_id = p.prop_id
join trans_group tg with(nolock)
 on tg.trans_group_id = ct.trans_group_id
join refund_transaction_assoc pta with(nolock)
 on pta.transaction_id = ct.transaction_id
join batch ba with(nolock)
 on ba.batch_id = ct.batch_id
where tg.trans_group_type = 'F'
and ba.balance_dt >= @begin_date 
and ba.balance_dt <= @end_date
and f.fee_type_cd = 'ICC'
--and p.geo_id = '112964010660003           '
group by p.prop_id,  p.geo_id, ft.fee_type_desc, f.display_year,  pta.refund_id, ba.balance_dt
 
 
select distinct p.prop_id, p.geo_id,
 ft.fee_type_desc,
 f.display_year, 
 ba.balance_dt, 
 'REFUND' as type,
 pta.refund_id as ID, 
 sum(ct.base_amount_pd) fee_base_ref,
 sum(ct.interest_amount_pd) fee_int_ref,
 sum(ct.penalty_amount_pd) fee_pen_ref,
 SUM(ct.overage_amount_pd - ct.underage_amount_pd) fee_over_short
into #ircc_ref
from coll_transaction ct with(nolock)
join fee f with(nolock)
 on f.fee_id = ct.trans_group_id
join fee_type ft with(nolock)
 on ft.fee_type_cd = f.fee_type_cd
join fee_prop_assoc fpa with(Nolock)
 on fpa.fee_id = f.fee_id
join property p with(nolock)
 on fpa.prop_id = p.prop_id
join trans_group tg with(nolock)
 on tg.trans_group_id = ct.trans_group_id
join refund_transaction_assoc pta with(nolock)
 on pta.transaction_id = ct.transaction_id
join batch ba with(nolock)
 on ba.batch_id = ct.batch_id
where tg.trans_group_type = 'F'
and ba.balance_dt >= @begin_date 
and ba.balance_dt <= @end_date
and f.fee_type_cd = 'IRCC'
--and p.geo_id = '112964010660003           '
group by p.prop_id,  p.geo_id, ft.fee_type_desc, f.display_year,  pta.refund_id, ba.balance_dt
 
select distinct p.prop_id, p.geo_id,
 ft.fee_type_desc,
 f.display_year, 
 ba.balance_dt, 
 'REFUND' as type,
 pta.refund_id as ID, 
 sum(ct.base_amount_pd) fee_base_ref,
 sum(ct.interest_amount_pd) fee_int_ref,
 sum(ct.penalty_amount_pd) fee_pen_ref,
 SUM(ct.overage_amount_pd - ct.underage_amount_pd) fee_over_short
into #irrcc_ref
from coll_transaction ct with(nolock)
join fee f with(nolock)
 on f.fee_id = ct.trans_group_id
join fee_type ft with(nolock)
 on ft.fee_type_cd = f.fee_type_cd
join fee_prop_assoc fpa with(Nolock)
 on fpa.fee_id = f.fee_id
join property p with(nolock)
 on fpa.prop_id = p.prop_id
join trans_group tg with(nolock)
 on tg.trans_group_id = ct.trans_group_id
join refund_transaction_assoc pta with(nolock)
 on pta.transaction_id = ct.transaction_id
join batch ba with(nolock)
 on ba.batch_id = ct.batch_id
where tg.trans_group_type = 'F'
and ba.balance_dt >= @begin_date 
and ba.balance_dt <= @end_date
and f.fee_type_cd = 'IRRCC'
--and p.geo_id = '112964010660003           '
group by p.prop_id,  p.geo_id, ft.fee_type_desc, f.display_year,  pta.refund_id, ba.balance_dt
 
 
select distinct p.prop_id, p.geo_id,
 ft.fee_type_desc,
 f.display_year, 
 ba.balance_dt, 
 'REFUND' as type,
 pta.refund_id as ID, 
 sum(ct.base_amount_pd) fee_base_ref,
 sum(ct.interest_amount_pd) fee_int_ref,
 sum(ct.penalty_amount_pd) fee_pen_ref,
 SUM(ct.overage_amount_pd - ct.underage_amount_pd) fee_over_short
into #irrdl_ref
from coll_transaction ct with(nolock)
join fee f with(nolock)
 on f.fee_id = ct.trans_group_id
join fee_type ft with(nolock)
 on ft.fee_type_cd = f.fee_type_cd
join fee_prop_assoc fpa with(Nolock)
 on fpa.fee_id = f.fee_id
join property p with(nolock)
 on fpa.prop_id = p.prop_id
join trans_group tg with(nolock)
 on tg.trans_group_id = ct.trans_group_id
join refund_transaction_assoc pta with(nolock)
 on pta.transaction_id = ct.transaction_id
join batch ba with(nolock)
 on ba.batch_id = ct.batch_id
where tg.trans_group_type = 'F'
and ba.balance_dt >= @begin_date 
and ba.balance_dt <= @end_date
and f.fee_type_cd = 'IRRDL'
--and p.geo_id = '112964010660003           '
group by p.prop_id,  p.geo_id, ft.fee_type_desc, f.display_year,  pta.refund_id, ba.balance_dt
 
 
---RESULTS
 
select b.*, 
 ISNULL(icc.fee_type_desc, 'No ICC Fee') as ICC_fee, 
 ISNULL(icc.fee_base_pd, 0) as ICC_base_pd, 
 ISNULL(icc.fee_int_pd, 0) as ICC_int_pd,
 ISNULL(icc.fee_pen_pd, 0) as ICC_pen_pd,
 ISNULL(icc.fee_over_short, 0) as ICC_over_short,
 ISNULL(IRCC.fee_type_desc, 'No IRCC Fee') as IRCC_fee, 
 ISNULL(IRCC.fee_base_pd, 0) as IRCC_base_pd, 
 ISNULL(IRCC.fee_int_pd, 0) as IRCC_int_pd,
 ISNULL(IRCC.fee_pen_pd, 0) as IRCC_pen_pd,
 ISNULL(ircc.fee_over_short, 0) as IRCC_over_short,
 ISNULL(IRRCC.fee_type_desc, 'No IRRCC Fee') as IRRCC_fee, 
 ISNULL(IRRCC.fee_base_pd, 0) as IRRCC_base_pd, 
 ISNULL(IRRCC.fee_int_pd, 0) as IRRCC_int_pd,
 ISNULL(IRRCC.fee_pen_pd, 0) as IRRCC_pen_pd,
 ISNULL(irrcc.fee_over_short, 0) as IRRCC_over_short,
 ISNULL(IRRDL.fee_type_desc, 'No IRRDL Fee') as IRRDL_fee, 
 ISNULL(IRRDL.fee_base_pd, 0) as IRRDL_base_pd, 
 ISNULL(IRRDL.fee_int_pd, 0) as IRRDL_int_pd,
 ISNULL(IRRDL.fee_pen_pd, 0) as IRRDL_pen_pd,
 ISNULL(irrdl.fee_over_short, 0) as IRRDL_over_short
--into #results
from #assm_bill_pd b
left join #icc_pd icc
 on icc.geo_id = b.geo_id
 and icc.display_year = b.display_year
 and icc.ID = b.ID
left join #ircc_pd ircc
 on ircc.geo_id = b.geo_id
 and ircc.display_year = b.display_year
 and ircc.ID = b.ID
left join #irrcc_pd irrcc
 on irrcc.geo_id = b.geo_id
 and irrcc.display_year = b.display_year
 and irrcc.ID = b.ID
left join #irrdl_pd irrdl
 on irrdl.geo_id = b.geo_id
 and irrdl.display_year = b.display_year
 and irrdl.ID = b.ID
 
 
union
 
--insert into #results
select icc.prop_id, icc.geo_id, 'No Assessment Paid' as assessment_description, icc.display_year, 
 icc.balance_dt, icc.type, icc.ID, 0 as assm_base_pd, 0 as assm_int_pd, 0 as assm_pen_pd,  0 as assm_over_short,
 icc.fee_type_desc as ICC_fee, 
 icc.fee_base_pd  as ICC_base_pd, 
 icc.fee_int_pd as ICC_int_pd,
 icc.fee_over_short as ICC_over_short,
 ISNULL(icc.fee_pen_pd, 0) as ICC_pen_pd,
 ISNULL(IRCC.fee_type_desc, 'No IRCC Fee') as IRCC_fee, 
 ISNULL(IRCC.fee_base_pd, 0) as IRCC_base_pd, 
 ISNULL(IRCC.fee_int_pd, 0) as IRCC_int_pd,
 ISNULL(IRCC.fee_pen_pd, 0) as IRCC_pen_pd,
 ISNULL(ircc.fee_over_short, 0) as IRCC_over_short,
 ISNULL(IRRCC.fee_type_desc, 'No IRRCC Fee') as IRRCC_fee, 
 ISNULL(IRRCC.fee_base_pd, 0) as IRRCC_base_pd, 
 ISNULL(IRRCC.fee_int_pd, 0) as IRRCC_int_pd,
 ISNULL(IRRCC.fee_pen_pd, 0) as IRRCC_pen_pd,
 ISNULL(irrcc.fee_over_short, 0) as IRRCC_over_short,
 ISNULL(IRRDL.fee_type_desc, 'No IRRDL Fee') as IRRDL_fee, 
 ISNULL(IRRDL.fee_base_pd, 0) as IRRDL_base_pd, 
 ISNULL(IRRDL.fee_int_pd, 0) as IRRDL_int_pd,
 ISNULL(IRRDL.fee_pen_pd, 0) as IRRDL_pen_pd,
 ISNULL(irrdl.fee_over_short, 0) as IRRDL_over_short
from #icc_pd icc
left join #ircc_pd ircc
 on ircc.geo_id = icc.geo_id
 and ircc.display_year = icc.display_year
 and ircc.ID = icc.ID
left join #irrcc_pd irrcc
 on irrcc.geo_id = icc.geo_id
 and irrcc.display_year = icc.display_year
 and irrcc.ID = icc.ID
left join #irrdl_pd irrdl
 on irrdl.geo_id = icc.geo_id
 and irrdl.display_year = icc.display_year
 and irrdl.ID = icc.ID
where not exists (select * from #assm_bill_pd where icc.geo_id = geo_id and icc.display_year = display_Year and icc.id = id)
--icc.geo_id not in (select geo_id from #assm_bill_pd) 
 
union
 
--insert into #results
select ircc.prop_id, ircc.geo_id, 'No Assessment Paid' as assessment_description, ircc.display_year, 
 ircc.balance_dt, ircc.type, ircc.ID, 0 as assm_base_pd, 0 as assm_int_pd, 0 as assm_pen_pd,  0 as assm_over_short,
 'No ICC Fee' as ICC_fee, 
 0 as ICC_base_pd, 
 0 as ICC_int_pd,
 0 as ICC_pen_pd,
 0 as ICC_over_short,
 IRCC.fee_type_desc as IRCC_fee, 
 IRCC.fee_base_pd as IRCC_base_pd, 
 IRCC.fee_int_pd as IRCC_int_pd,
 IRCC.fee_pen_pd as IRCC_pen_pd,
 IRCC.fee_over_short as IRCC_over_short,
 ISNULL(IRRCC.fee_type_desc, 'No IRRCC Fee') as IRRCC_fee, 
 ISNULL(IRRCC.fee_base_pd, 0) as IRRCC_base_pd, 
 ISNULL(IRRCC.fee_int_pd, 0) as IRRCC_int_pd,
 ISNULL(IRRCC.fee_pen_pd, 0) as IRRCC_pen_pd,
 ISNULL(irrcc.fee_over_short, 0) as IRRCC_over_short,
 ISNULL(IRRDL.fee_type_desc, 'No IRRDL Fee') as IRRDL_fee, 
 ISNULL(IRRDL.fee_base_pd, 0) as IRRDL_base_pd, 
 ISNULL(IRRDL.fee_int_pd, 0) as IRRDL_int_pd,
 ISNULL(IRRDL.fee_pen_pd, 0) as IRRDL_pen_pd,
 ISNULL(irrdl.fee_over_short, 0) as IRRDL_over_short
from #ircc_pd ircc
left join #irrcc_pd irrcc
 on irrcc.geo_id = ircc.geo_id
 and irrcc.display_year = ircc.display_year
 and irrcc.ID = ircc.ID
left join #irrdl_pd irrdl
 on irrdl.geo_id = ircc.geo_id
 and irrdl.display_year = ircc.display_year
 and irrdl.ID = ircc.ID
where not exists (select * from #assm_bill_pd where ircc.geo_id = geo_id and ircc.display_year = display_Year and ircc.id = id)
and not exists (select * from #icc_pd where ircc.geo_id = geo_id and ircc.display_year = display_Year and ircc.id = id)
--where ircc.geo_id not in (select geo_id from #assm_bill_pd) 
--and ircc.geo_id not in (select geo_id from #icc_pd)
 
union
 
--insert into #results
select irrcc.prop_id, irrcc.geo_id, 'No Assessment Paid' as assessment_description, irrcc.display_year, 
 irrcc.balance_dt, irrcc.type, irrcc.ID, 0 as assm_base_pd, 0 as assm_int_pd, 0 as assm_pen_pd,  0 as assm_over_short,
 'No ICC Fee' as ICC_fee, 
 0 as ICC_base_pd, 
 0 as ICC_int_pd,
 0 as ICC_pen_pd,
 0 as ICC_over_short,
 'No IRCC Fee' as IRCC_fee, 
 0 as IRCC_base_pd, 
 0 as IRCC_int_pd,
 0 as IRCC_pen_pd,
 0 as IRCC_over_short,
 IRRCC.fee_type_desc as IRRCC_fee, 
 IRRCC.fee_base_pd as IRRCC_base_pd, 
 IRRCC.fee_int_pd as IRRCC_int_pd,
 IRRCC.fee_pen_pd as IRRCC_pen_pd,
 IRRCC.fee_over_short as IRRCC_over_short,
 ISNULL(IRRDL.fee_type_desc, 'No IRRDL Fee') as IRRDL_fee, 
 ISNULL(IRRDL.fee_base_pd, 0) as IRRDL_base_pd, 
 ISNULL(IRRDL.fee_int_pd, 0) as IRRDL_int_pd,
 ISNULL(IRRDL.fee_pen_pd, 0) as IRRDL_pen_pd,
 ISNULL(IRRDL.fee_over_short, 0) as IRRDL_over_short
from #irrcc_pd irrcc
left join #irrdl_pd irrdl
 on irrdl.geo_id = irrcc.geo_id
 and irrdl.display_year = irrcc.display_year
 and irrdl.ID = irrcc.ID
where not exists (select * from #assm_bill_pd where irrcc.geo_id = geo_id and irrcc.display_year = display_Year and irrcc.id = id)
and not exists (select * from #icc_pd where irrcc.geo_id = geo_id and irrcc.display_year = display_Year and irrcc.id = id)
and not exists (select * from #ircc_pd where irrcc.geo_id = geo_id and irrcc.display_year = display_Year and irrcc.id = id)
--where irrcc.geo_id not in (select geo_id from #assm_bill_pd) 
--and irrcc.geo_id not in (select geo_id from #icc_pd)
--and irrcc.geo_id not in (select geo_id from #ircc_pd)
 
union
 
--insert into #results
select irrdl.prop_id, irrdl.geo_id, 'No Assessment Paid' as assessment_description, irrdl.display_year, 
 irrdl.balance_dt, irrdl.type, irrdl.ID, 0 as assm_base_pd, 0 as assm_int_pd, 0 as assm_pen_pd,  0 as assm_over_short,
 'No ICC Fee' as ICC_fee, 
 0 as ICC_base_pd, 
 0 as ICC_int_pd,
 0 as ICC_pen_pd,
 0 as ICC_over_short,
 'No IRCC Fee' as IRCC_fee, 
 0 as IRCC_base_pd, 
 0 as IRCC_int_pd,
 0 as IRCC_pen_pd,
 0 as IRCC_over_short,
 'No IRRCC Fee' as IRRCC_fee, 
 0 as IRRCC_base_pd, 
 0 as IRRCC_int_pd,
 0 as IRRCC_pen_pd,
 0 as IRRCC_over_short,
 IRRDL.fee_type_desc as IRRDL_fee, 
 IRRDL.fee_base_pd as IRRDL_base_pd, 
 IRRDL.fee_int_pd as IRRDL_int_pd,
 IRRDL.fee_pen_pd as IRRDL_pen_pd,
 IRRDL.fee_over_short as IRRDL_over_short
from #irrdl_pd irrdl
where not exists (select * from #assm_bill_pd where irrdl.geo_id = geo_id and irrdl.display_year = display_Year and irrdl.id = id)
and not exists (select * from #icc_pd where irrdl.geo_id = geo_id and irrdl.display_year = display_Year and irrdl.id = id)
and not exists (select * from #ircc_pd where irrdl.geo_id = geo_id and irrdl.display_year = display_Year and irrdl.id = id)
and not exists (select * from #irrcc_pd where irrdl.geo_id = geo_id and irrdl.display_year = display_Year and irrdl.id = id)
--where irrdl.geo_id not in (select geo_id from #assm_bill_pd) 
--and irrdl.geo_id not in (select geo_id from #icc_pd)
--and irrdl.geo_id not in (select geo_id from #ircc_pd)
--and irrdl.geo_id not in (select geo_id from #irrcc_pd)
 
union
 
select b.*, 
 ISNULL(icc.fee_type_desc, 'No ICC Fee') as ICC_fee, 
 ISNULL(icc.fee_base_ref, 0) as ICC_base_pd, 
 ISNULL(icc.fee_int_ref, 0) as ICC_int_pd,
 ISNULL(icc.fee_pen_ref, 0) as ICC_pen_pd,
 ISNULL(icc.fee_over_short, 0) as ICC_over_short,
 ISNULL(IRCC.fee_type_desc, 'No IRCC Fee') as IRCC_fee, 
 ISNULL(IRCC.fee_base_ref, 0) as IRCC_base_pd, 
 ISNULL(IRCC.fee_int_ref, 0) as IRCC_int_pd,
 ISNULL(IRCC.fee_pen_ref, 0) as IRCC_pen_pd,
 ISNULL(ircc.fee_over_short, 0) as IRCC_over_short,
 ISNULL(IRRCC.fee_type_desc, 'No IRRCC Fee') as IRRCC_fee, 
 ISNULL(IRRCC.fee_base_ref, 0) as IRRCC_base_pd, 
 ISNULL(IRRCC.fee_int_ref, 0) as IRRCC_int_pd,
 ISNULL(IRRCC.fee_pen_ref, 0) as IRRCC_pen_pd,
 ISNULL(irrcc.fee_over_short, 0) as IRRCC_over_short,
 ISNULL(IRRDL.fee_type_desc, 'No IRRDL Fee') as IRRDL_fee, 
 ISNULL(IRRDL.fee_base_ref, 0) as IRRDL_base_pd, 
 ISNULL(IRRDL.fee_int_ref, 0) as IRRDL_int_pd,
 ISNULL(IRRDL.fee_pen_ref, 0) as IRRDL_pen_pd,
 ISNULL(irrdl.fee_over_short, 0) as IRRDL_over_short
--into #results
from #assm_bill_ref b
left join #icc_ref icc
 on icc.geo_id = b.geo_id
 and icc.display_year = b.display_year
 and icc.ID = b.ID
left join #ircc_ref ircc
 on ircc.geo_id = b.geo_id
 and ircc.display_year = b.display_year
 and ircc.ID = b.ID
left join #irrcc_ref irrcc
 on irrcc.geo_id = b.geo_id
 and irrcc.display_year = b.display_year
 and irrcc.ID = b.ID
left join #irrdl_ref irrdl
 on irrdl.geo_id = b.geo_id
 and irrdl.display_year = b.display_year
 and irrdl.ID = b.ID
 
 
union
 
--insert into #results
select icc.prop_id, icc.geo_id, 'No Assessment Paid' as assessment_description, icc.display_year, 
 icc.balance_dt, icc.type, icc.ID, 0 as assm_base_pd, 0 as assm_int_ref, 0 as assm_pen_pd,  0 as assm_over_short,
 icc.fee_type_desc as ICC_fee, 
 icc.fee_base_ref  as ICC_base_pd, 
 icc.fee_int_ref as ICC_int_pd,
 icc.fee_over_short as ICC_over_short,
 ISNULL(icc.fee_pen_ref, 0) as ICC_pen_pd,
 ISNULL(IRCC.fee_type_desc, 'No IRCC Fee') as IRCC_fee, 
 ISNULL(IRCC.fee_base_ref, 0) as IRCC_base_pd, 
 ISNULL(IRCC.fee_int_ref, 0) as IRCC_int_pd,
 ISNULL(IRCC.fee_pen_ref, 0) as IRCC_pen_pd,
 ISNULL(ircc.fee_over_short, 0) as IRCC_over_short,
 ISNULL(IRRCC.fee_type_desc, 'No IRRCC Fee') as IRRCC_fee, 
 ISNULL(IRRCC.fee_base_ref, 0) as IRRCC_base_pd, 
 ISNULL(IRRCC.fee_int_ref, 0) as IRRCC_int_pd,
 ISNULL(IRRCC.fee_pen_ref, 0) as IRRCC_pen_pd,
 ISNULL(irrcc.fee_over_short, 0) as IRRCC_over_short,
 ISNULL(IRRDL.fee_type_desc, 'No IRRDL Fee') as IRRDL_fee, 
 ISNULL(IRRDL.fee_base_ref, 0) as IRRDL_base_pd, 
 ISNULL(IRRDL.fee_int_ref, 0) as IRRDL_int_pd,
 ISNULL(IRRDL.fee_pen_ref, 0) as IRRDL_pen_pd,
 ISNULL(irrdl.fee_over_short, 0) as IRRDL_over_short
from #icc_ref icc
left join #ircc_ref ircc
 on ircc.geo_id = icc.geo_id
 and ircc.display_year = icc.display_year
 and ircc.ID = icc.ID
left join #irrcc_ref irrcc
 on irrcc.geo_id = icc.geo_id
 and irrcc.display_year = icc.display_year
 and irrcc.ID = icc.ID
left join #irrdl_ref irrdl
 on irrdl.geo_id = icc.geo_id
 and irrdl.display_year = icc.display_year
 and irrdl.ID = icc.ID
where not exists (select * from #assm_bill_ref where icc.geo_id = geo_id and icc.display_year = display_Year and icc.id = id)
--where irrdl.geo_id not in (select geo_id from #assm_bill_ref) 
 
 
union
 
--insert into #results
select ircc.prop_id, ircc.geo_id, 'No Assessment Paid' as assessment_description, ircc.display_year, 
 ircc.balance_dt, ircc.type, ircc.ID, 0 as assm_base_pd, 0 as assm_int_pd, 0 as assm_pen_pd,  0 as assm_over_short,
 'No ICC Fee' as ICC_fee, 
 0 as ICC_base_pd, 
 0 as ICC_int_pd,
 0 as ICC_pen_pd,
 0 as ICC_over_short,
 IRCC.fee_type_desc as IRCC_fee, 
 IRCC.fee_base_ref as IRCC_base_pd, 
 IRCC.fee_int_ref as IRCC_int_pd,
 IRCC.fee_pen_ref as IRCC_pen_pd,
 IRCC.fee_over_short as IRCC_over_short,
 ISNULL(IRRCC.fee_type_desc, 'No IRRCC Fee') as IRRCC_fee, 
 ISNULL(IRRCC.fee_base_ref, 0) as IRRCC_base_pd, 
 ISNULL(IRRCC.fee_int_ref, 0) as IRRCC_int_pd,
 ISNULL(IRRCC.fee_pen_ref, 0) as IRRCC_pen_pd,
 ISNULL(irrcc.fee_over_short, 0) as IRRCC_over_short,
 ISNULL(IRRDL.fee_type_desc, 'No IRRDL Fee') as IRRDL_fee, 
 ISNULL(IRRDL.fee_base_ref, 0) as IRRDL_base_pd, 
 ISNULL(IRRDL.fee_int_ref, 0) as IRRDL_int_pd,
 ISNULL(IRRDL.fee_pen_ref, 0) as IRRDL_pen_pd,
 ISNULL(irrdl.fee_over_short, 0) as IRRDL_over_short
from #ircc_ref ircc
left join #irrcc_ref irrcc
 on irrcc.geo_id = ircc.geo_id
 and irrcc.display_year = ircc.display_year
 and irrcc.ID = ircc.ID
left join #irrdl_ref irrdl
 on irrdl.geo_id = ircc.geo_id
 and irrdl.display_year = ircc.display_year
 and irrdl.ID = ircc.ID
where not exists (select * from #assm_bill_ref where ircc.geo_id = geo_id and ircc.display_year = display_Year and ircc.id = id)
and not exists (select * from #icc_ref where ircc.geo_id = geo_id and ircc.display_year = display_Year and ircc.id = id)
--where irrdl.geo_id not in (select geo_id from #assm_bill_ref) 
--and irrdl.geo_id not in (select geo_id from #icc_ref)
 
union
 
--insert into #results
select irrcc.prop_id, irrcc.geo_id, 'No Assessment Paid' as assessment_description, irrcc.display_year, 
 irrcc.balance_dt, irrcc.type, irrcc.ID, 0 as assm_base_pd, 0 as assm_int_pd, 0 as assm_pen_pd,  0 as assm_over_short,
 'No ICC Fee' as ICC_fee, 
 0 as ICC_base_pd, 
 0 as ICC_int_pd,
 0 as ICC_pen_pd,
 0 as ICC_over_short,
 'No IRCC Fee' as IRCC_fee, 
 0 as IRCC_base_pd, 
 0 as IRCC_int_pd,
 0 as IRCC_pen_pd,
 0 as IRCC_over_short,
 IRRCC.fee_type_desc as IRRCC_fee, 
 IRRCC.fee_base_ref as IRRCC_base_pd, 
 IRRCC.fee_int_ref as IRRCC_int_pd,
 IRRCC.fee_pen_ref as IRRCC_pen_pd,
 IRRCC.fee_over_short as IRRCC_over_short,
 ISNULL(IRRDL.fee_type_desc, 'No IRRDL Fee') as IRRDL_fee, 
 ISNULL(IRRDL.fee_base_ref, 0) as IRRDL_base_pd, 
 ISNULL(IRRDL.fee_int_ref, 0) as IRRDL_int_pd,
 ISNULL(IRRDL.fee_pen_ref, 0) as IRRDL_pen_pd,
 ISNULL(IRRDL.fee_over_short, 0) as IRRDL_over_short
from #irrcc_ref irrcc
left join #irrdl_ref irrdl
 on irrdl.geo_id = irrcc.geo_id
 and irrdl.display_year = irrcc.display_year
 and irrdl.ID = irrcc.ID
where not exists (select * from #assm_bill_ref where irrcc.geo_id = geo_id and irrcc.display_year = display_Year and irrcc.id = id)
and not exists (select * from #icc_ref where irrcc.geo_id = geo_id and irrcc.display_year = display_Year and irrcc.id = id)
and not exists (select * from #ircc_ref where irrcc.geo_id = geo_id and irrcc.display_year = display_Year and irrcc.id = id) 
--where irrdl.geo_id not in (select geo_id from #assm_bill_ref) 
--and irrdl.geo_id not in (select geo_id from #icc_ref)
--and irrdl.geo_id not in (select geo_id from #ircc_ref)
 
union
 
--insert into #results
select irrdl.prop_id, irrdl.geo_id, 'No Assessment Paid' as assessment_description, irrdl.display_year, 
 irrdl.balance_dt, irrdl.type, irrdl.ID, 0 as assm_base_pd, 0 as assm_int_pd, 0 as assm_pen_pd,  0 as assm_over_short,
 'No ICC Fee' as ICC_fee, 
 0 as ICC_base_pd, 
 0 as ICC_int_pd,
 0 as ICC_pen_pd,
 0 as ICC_over_short,
 'No IRCC Fee' as IRCC_fee, 
 0 as IRCC_base_pd, 
 0 as IRCC_int_pd,
 0 as IRCC_pen_pd,
 0 as IRCC_over_short,
 'No IRRCC Fee' as IRRCC_fee, 
 0 as IRRCC_base_pd, 
 0 as IRRCC_int_pd,
 0 as IRRCC_pen_pd,
 0 as IRRCC_over_short,
 IRRDL.fee_type_desc as IRRDL_fee, 
 IRRDL.fee_base_ref as IRRDL_base_pd, 
 IRRDL.fee_int_ref as IRRDL_int_pd,
 IRRDL.fee_pen_ref as IRRDL_pen_pd,
 IRRDL.fee_over_short as IRRDL_over_short
from #irrdl_ref irrdl
where not exists (select * from #assm_bill_ref where irrdl.geo_id = geo_id and irrdl.display_year = display_Year and irrdl.id = id)
and not exists (select * from #icc_ref where irrdl.geo_id = geo_id and irrdl.display_year = display_Year and irrdl.id = id)
and not exists (select * from #ircc_ref where irrdl.geo_id = geo_id and irrdl.display_year = display_Year and irrdl.id = id)
and not exists (select * from #irrcc_ref where irrdl.geo_id = geo_id and irrdl.display_year = display_Year and irrdl.id = id)
--where irrdl.geo_id not in (select geo_id from #assm_bill_ref) 
--and irrdl.geo_id not in (select geo_id from #icc_ref)
--and irrdl.geo_id not in (select geo_id from #ircc_ref)
--and irrdl.geo_id not in (select geo_id from #irrcc_ref)

GO

