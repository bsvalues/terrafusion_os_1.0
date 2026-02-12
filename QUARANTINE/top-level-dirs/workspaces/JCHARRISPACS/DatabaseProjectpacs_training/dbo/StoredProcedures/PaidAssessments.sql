










--here is how you set up the monitor call:  {Call PaidAssessments ('1/1/2017', '1/31/2017')}    





CREATE procedure [dbo].[PaidAssessments]          





@begin_date  datetime,

@end_date datetime





as          



set nocount on        





-----PAYMENTS



select p.geo_id,

	saa.assessment_description,

	b.display_year, 

	bp.balance_dt, 

	'PAYMENT' as type,

	bp.payment_id, 

	bp.assm_base_pd,

	bp.assm_int_pd,

	bp.assm_pen_pd,

	bp.assm_over_short,

	case when count(fp.fee_type_cd) = 0 then 'No Fee'

		else 'Fees Paid'

		end  as fee_type,

	sum(isnull(fp.fee_base_pd,0)) fee_base_pd,

	sum(isnull(fp.fee_int_pd,0)) as fee_int_pd,

	sum(isnull(fp.fee_pen_pd, 0)) as fee_pen_pd,

	SUM(isnull(fp.fee_over_short,0)) as fee_over_short

into #assm_pd

from bill b with(nolock)

left join bill_fee_assoc bfa with(nolock)

	on bfa.bill_id = b.bill_id

left join fee f with(nolock)

	on f.fee_id = bfa.fee_id

join property p with(nolock)

	on p.prop_id = b.prop_id

join assessment_bill ab with(nolock)

	on ab.bill_id = b.bill_id

join special_assessment_agency as saa with(nolock)

	on saa.agency_id = ab.agency_id

	and saa.assessment_type_cd = 'IRRI'

join (select ct.trans_group_id, pta.payment_id, ba.balance_dt, sum(ct.base_amount_pd) assm_base_pd, 

			sum(ct.penalty_amount_pd) assm_pen_pd, sum(ct.interest_amount_pd) assm_int_pd, 

			SUM(ct.overage_amount_pd - ct.underage_amount_pd) assm_over_short

		from coll_transaction ct with(nolock)

		join trans_group tg with(nolock)

			on tg.trans_group_id = ct.trans_group_id

		join payment_transaction_assoc pta with(nolock)

			on pta.transaction_id = ct.transaction_id

		join batch ba with(nolock)

			on ba.batch_id = ct.batch_id

		where tg.trans_group_type = 'AB'

		and ba.balance_dt >= @begin_date

		and ba.balance_dt <= @end_date

		group by ct.trans_group_id, pta.payment_id, ba.balance_dt) as bp

	on bp.trans_group_id = b.bill_id

left join (select fpa.prop_id, f.fee_type_cd, f.display_year, ct.trans_group_id, 

				pta.payment_id, ba.balance_dt, sum(ct.base_amount_pd) fee_base_pd, 

			sum(ct.penalty_amount_pd) fee_pen_pd, sum(ct.interest_amount_pd) fee_int_pd,

			SUM(ct.overage_amount_pd - ct.underage_amount_pd) fee_over_short

		from coll_transaction ct with(nolock)

		join fee f with(nolock)

			on f.fee_id = ct.trans_group_id

		join fee_prop_assoc fpa with(Nolock)

			on fpa.fee_id = f.fee_id

		join trans_group tg with(nolock)

			on tg.trans_group_id = ct.trans_group_id

		join payment_transaction_assoc pta with(nolock)

			on pta.transaction_id = ct.transaction_id

		join batch ba with(nolock)

			on ba.batch_id = ct.batch_id

		where tg.trans_group_type = 'F'

		and f.fee_type_cd in ('ICC', 'IRCC', 'IRRCC', 'IRRDL')

		and ba.balance_dt >= @begin_date

		and ba.balance_dt <= @end_date

		group by fpa.prop_id, f.fee_type_cd, f.display_year, ct.trans_group_id, pta.payment_id, ba.balance_dt) as fp

	on fp.prop_id = b.prop_id

	and fp.display_year = b.display_year

	and fp.payment_id = bp.payment_id

group by p.geo_id,

	saa.assessment_description,

	b.display_year, 

	bp.balance_dt, 

	bp.payment_id, 

	bp.assm_base_pd,

	bp.assm_int_pd,

	bp.assm_pen_pd,

	bp.assm_over_short







--union



insert into #assm_pd

select p.geo_id,

	saa.assessment_description,

	b.display_year, 

	bp.balance_dt, 

	'PAYMENT' as type,

	bp.payment_id, 

	bp.assm_base_pd,

	bp.assm_int_pd,

	bp.assm_pen_pd,

	bp.assm_over_short,

	'No Fee' as fee_type,

	0 as fee_base_pd,

	0 as fee_int_pd,

	0 as fee_pen_pd,

	0 as fee_over_short

from bill b with(nolock)

left join bill_fee_assoc bfa with(nolock)

	on bfa.bill_id = b.bill_id

left join fee f with(nolock)

	on f.fee_id = bfa.fee_id

join property p with(nolock)

	on p.prop_id = b.prop_id

join assessment_bill ab with(nolock)

	on ab.bill_id = b.bill_id

join special_assessment_agency as saa with(nolock)

	on saa.agency_id = ab.agency_id

	and saa.assessment_type_cd <> 'IRRI'

join (select ct.trans_group_id, pta.payment_id, ba.balance_dt, sum(ct.base_amount_pd) assm_base_pd, 

			sum(ct.penalty_amount_pd) assm_pen_pd, sum(ct.interest_amount_pd) assm_int_pd,

			SUM(ct.overage_amount_pd - ct.underage_amount_pd) assm_over_short

		from coll_transaction ct with(nolock)

		join trans_group tg with(nolock)

			on tg.trans_group_id = ct.trans_group_id

		join payment_transaction_assoc pta with(nolock)

			on pta.transaction_id = ct.transaction_id

		join batch ba with(nolock)

			on ba.batch_id = ct.batch_id

		where tg.trans_group_type = 'AB'

		and ba.balance_dt >= @begin_date

		and ba.balance_dt <= @end_date

		group by ct.trans_group_id, pta.payment_id, ba.balance_dt) as bp

	on bp.trans_group_id = b.bill_id

--group by p.geo_id,

--	saa.assessment_description,

--	b.display_year, 

--	bp.balance_dt, 

--	bp.payment_id, 

--	bp.assm_base_pd,

--	bp.assm_int_pd,

--	bp.assm_pen_pd

order by bp.payment_id, assessment_description



insert into #assm_pd

select distinct p.geo_id, ('No Assessment Paid' + ' - ' + saa.assessment_description)  as assessment_description, f.display_year, ba.balance_dt, 'PAYMENT' as type, pta.payment_id,

	0 as assm_base_pd, 0 as assm_int_pd, 0 as assm_pen_pd, 0 as assm_over_short, f.fee_type_cd, 

	sum(ct.base_amount_pd) fee_base_pd,  sum(ct.interest_amount_pd) fee_int_pd,sum(ct.penalty_amount_pd) fee_pen_pd,

	SUM(ct.overage_amount_pd - ct.underage_amount_pd) fee_over_short

from coll_transaction ct with(nolock)

join fee f with(nolock)

	on f.fee_id = ct.trans_group_id

join fee_prop_assoc fpa with(Nolock)

	on fpa.fee_id = f.fee_id

join property p with(nolock)

	on p.prop_id = fpa.prop_id

join property_special_assessment pspa with(nolock)

	on pspa.prop_id = p.prop_id

	and pspa.year = f.year

join prop_supp_assoc psa with(nolock)

	on psa.prop_id = pspa.prop_id

	and psa.owner_tax_yr = pspa.year

	and psa.sup_num = pspa.sup_num

join special_assessment_agency saa with(nolock)

	on saa.agency_id = pspa.agency_id

	and saa.assessment_type_cd = 'IRRI'

join trans_group tg with(nolock)

	on tg.trans_group_id = ct.trans_group_id

join payment_transaction_assoc pta with(nolock)

	on pta.transaction_id = ct.transaction_id

join batch ba with(nolock)

	on ba.batch_id = ct.batch_id

where tg.trans_group_type = 'F'

and f.fee_type_cd in ('ICC', 'IRCC', 'IRRCC', 'IRRDL')

and ba.balance_dt >= @begin_date

and ba.balance_dt <= @end_date

and not exists (select * from #assm_pd where geo_id = p.geo_id and payment_id = pta.payment_id and assessment_description like '%irrigation%')

group by p.geo_id, saa.assessment_description, f.fee_type_cd, f.display_year, ct.trans_group_id, pta.payment_id, ba.balance_dt





----REFUNDS





insert into #assm_pd

select p.geo_id,

	saa.assessment_description,

	b.display_year, 

	bp.balance_dt, 

	'REFUND' as type,

	bp.refund_id, 

	bp.assm_base_pd,

	bp.assm_int_pd,

	bp.assm_pen_pd,

	bp.assm_over_short,

	case when count(fp.fee_type_cd) = 0 then 'No Fee'

		else 'Fees Paid'

		end  as fee_type,

	sum(isnull(fp.fee_base_pd,0)) fee_base_pd,

	sum(isnull(fp.fee_int_pd,0)) as fee_int_pd,

	sum(isnull(fp.fee_pen_pd, 0)) as fee_pen_pd,

	SUM(isnull(fp.fee_over_short,0)) as fee_over_short

from bill b with(nolock)

left join bill_fee_assoc bfa with(nolock)

	on bfa.bill_id = b.bill_id

left join fee f with(nolock)

	on f.fee_id = bfa.fee_id

join property p with(nolock)

	on p.prop_id = b.prop_id

join assessment_bill ab with(nolock)

	on ab.bill_id = b.bill_id

join special_assessment_agency as saa with(nolock)

	on saa.agency_id = ab.agency_id

	and saa.assessment_type_cd = 'IRRI'

join (select ct.trans_group_id, pta.refund_id, ba.balance_dt, sum(ct.base_amount_pd) assm_base_pd, 

			sum(ct.penalty_amount_pd) assm_pen_pd, sum(ct.interest_amount_pd) assm_int_pd, 

			SUM(ct.overage_amount_pd - ct.underage_amount_pd) assm_over_short

		from coll_transaction ct with(nolock)

		join trans_group tg with(nolock)

			on tg.trans_group_id = ct.trans_group_id

		join refund_transaction_assoc pta with(nolock)

			on pta.transaction_id = ct.transaction_id

		join batch ba with(nolock)

			on ba.batch_id = ct.batch_id

		where tg.trans_group_type = 'AB'

		and ba.balance_dt >= @begin_date

		and ba.balance_dt <= @end_date

		group by ct.trans_group_id, pta.refund_id, ba.balance_dt) as bp

	on bp.trans_group_id = b.bill_id

left join (select fpa.prop_id, f.fee_type_cd, f.display_year, ct.trans_group_id, 

				pta.refund_id, ba.balance_dt, sum(ct.base_amount_pd) fee_base_pd, 

			sum(ct.penalty_amount_pd) fee_pen_pd, sum(ct.interest_amount_pd) fee_int_pd,

			SUM(ct.overage_amount_pd - ct.underage_amount_pd) fee_over_short

		from coll_transaction ct with(nolock)

		join fee f with(nolock)

			on f.fee_id = ct.trans_group_id

		join fee_prop_assoc fpa with(Nolock)

			on fpa.fee_id = f.fee_id

		join trans_group tg with(nolock)

			on tg.trans_group_id = ct.trans_group_id

		join refund_transaction_assoc pta with(nolock)

			on pta.transaction_id = ct.transaction_id

		join batch ba with(nolock)

			on ba.batch_id = ct.batch_id

		where tg.trans_group_type = 'F'

		and f.fee_type_cd in ('ICC', 'IRCC', 'IRRCC', 'IRRDL')

		and ba.balance_dt >= @begin_date

		and ba.balance_dt <= @end_date

		group by fpa.prop_id, f.fee_type_cd, f.display_year, ct.trans_group_id, pta.refund_id, ba.balance_dt) as fp

	on fp.prop_id = b.prop_id

	and fp.display_year = b.display_year

	and fp.refund_id = bp.refund_id

group by p.geo_id,

	saa.assessment_description,

	b.display_year, 

	bp.balance_dt, 

	bp.refund_id, 

	bp.assm_base_pd,

	bp.assm_int_pd,

	bp.assm_pen_pd,

	bp.assm_over_short







--union



insert into #assm_pd
select p.geo_id,

	saa.assessment_description,

	b.display_year, 

	bp.balance_dt, 

	'REFUND' as type,

	bp.refund_id, 

	bp.assm_base_pd,

	bp.assm_int_pd,

	bp.assm_pen_pd,

	bp.assm_over_short,

	'No Fee' as fee_type,

	0 as fee_base_pd,

	0 as fee_int_pd,

	0 as fee_pen_pd,

	0 as fee_over_short

from bill b with(nolock)

left join bill_fee_assoc bfa with(nolock)

	on bfa.bill_id = b.bill_id

left join fee f with(nolock)

	on f.fee_id = bfa.fee_id

join property p with(nolock)

	on p.prop_id = b.prop_id

join assessment_bill ab with(nolock)

	on ab.bill_id = b.bill_id

join special_assessment_agency as saa with(nolock)

	on saa.agency_id = ab.agency_id

	and saa.assessment_type_cd <> 'IRRI'

join (select ct.trans_group_id, pta.refund_id, ba.balance_dt, sum(ct.base_amount_pd) assm_base_pd, 

			sum(ct.penalty_amount_pd) assm_pen_pd, sum(ct.interest_amount_pd) assm_int_pd,

			SUM(ct.overage_amount_pd - ct.underage_amount_pd) assm_over_short

		from coll_transaction ct with(nolock)

		join trans_group tg with(nolock)

			on tg.trans_group_id = ct.trans_group_id

		join refund_transaction_assoc pta with(nolock)

			on pta.transaction_id = ct.transaction_id

		join batch ba with(nolock)

			on ba.batch_id = ct.batch_id

		where tg.trans_group_type = 'AB'

		and ba.balance_dt >= @begin_date

		and ba.balance_dt <= @end_date

		group by ct.trans_group_id, pta.refund_id, ba.balance_dt) as bp

	on bp.trans_group_id = b.bill_id

--group by p.geo_id,

--	saa.assessment_description,

--	b.display_year, 

--	bp.balance_dt, 

--	bp.payment_id, 

--	bp.assm_base_pd,

--	bp.assm_int_pd,

--	bp.assm_pen_pd

order by bp.refund_id, assessment_description



insert into #assm_pd

select distinct p.geo_id, ('No Assessment Paid' + ' - ' + saa.assessment_description)  as assessment_description,  f.display_year, ba.balance_dt, 'REFUND' as type, pta.refund_id,

	0 as assm_base_pd, 0 as assm_int_pd, 0 as assm_pen_pd, 0 as assm_over_short, f.fee_type_cd, 

	sum(ct.base_amount_pd) fee_base_pd,  sum(ct.interest_amount_pd) fee_int_pd,sum(ct.penalty_amount_pd) fee_pen_pd,

	SUM(ct.overage_amount_pd - ct.underage_amount_pd) fee_over_short

from coll_transaction ct with(nolock)

join fee f with(nolock)

	on f.fee_id = ct.trans_group_id

join fee_prop_assoc fpa with(Nolock)

	on fpa.fee_id = f.fee_id

join property p with(nolock)

	on p.prop_id = fpa.prop_id

join property_special_assessment pspa with(nolock)

	on pspa.prop_id = p.prop_id

	and pspa.year = f.year

join prop_supp_assoc psa with(nolock)

	on psa.prop_id = pspa.prop_id

	and psa.owner_tax_yr = pspa.year

	and psa.sup_num = pspa.sup_num

join special_assessment_agency saa with(nolock)

	on saa.agency_id = pspa.agency_id

	and saa.assessment_type_cd = 'IRRI'

join trans_group tg with(nolock)

	on tg.trans_group_id = ct.trans_group_id

join refund_transaction_assoc pta with(nolock)

	on pta.transaction_id = ct.transaction_id

join batch ba with(nolock)

	on ba.batch_id = ct.batch_id

where tg.trans_group_type = 'F'

and f.fee_type_cd in ('ICC', 'IRCC', 'IRRCC', 'IRRDL')

and ba.balance_dt >= @begin_date

and ba.balance_dt <= @end_date

and not exists (select * from #assm_pd where geo_id = p.geo_id and payment_id = pta.refund_id and assessment_description like '%irrigation%')

group by p.geo_id, saa.assessment_description, f.fee_type_cd, f.display_year, ct.trans_group_id, pta.refund_id, ba.balance_dt





select * from #assm_pd
order by assessment_description

GO

