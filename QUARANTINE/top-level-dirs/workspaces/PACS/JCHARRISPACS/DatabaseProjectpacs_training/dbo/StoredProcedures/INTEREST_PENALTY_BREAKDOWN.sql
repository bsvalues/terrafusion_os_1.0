

CREATE procedure [dbo].[INTEREST_PENALTY_BREAKDOWN]

@begin_date datetime,
@end_date datetime

as

SET NOCOUNT ON 

if object_id ('[#tmp]') is not null
begin
drop table [#tmp]
end

select case when trans_group_type = 'REET' then 'REET'
	when trans_group_type in ('LB', 'F')
		OR (trans_group_type = 'AB' and isnull(assessment_type_cd, '') not like '%lid') then 'TAXES'
	when trans_group_type = 'AB' and isnull(assessment_type_cd, '') like '%lid' then 'ULID'
	else 'OTHER'
	end as IP_type,
	sum(interest_amount_pd) delinquent_interest, sum(penalty_amount_pd) delinquent_penalty,
      sum(bond_interest_pd) bond_interest, sum(ct.other_amount_pd) refund_interest
into #tmp
from coll_transaction ct with(nolock)
join batch ba with(nolock)
      on ba.batch_id = ct.batch_id
join trans_group tg
      on tg.trans_group_id = ct.trans_group_id
left join bill b with(nolock)
      on b.bill_id = tg.trans_group_id
left join levy_bill lb with(nolock)
      on lb.bill_id = b.bill_id
left join levy l with(nolock)
      on l.year = lb.year
      and l.levy_cd = lb.levy_cd
      and l.tax_district_id = lb.tax_district_id
left join assessment_bill ab with(nolock)
      on ab.bill_id = b.bill_id
left join special_assessment_agency saa with(nolock)
      on saa.agency_id = ab.agency_id
left join bill_fee_assoc bfa with(nolock)
      on bfa.bill_id = b.bill_id
left join fee f with(nolock)
      on f.fee_id = bfa.fee_id
where (interest_amount_pd <> 0 or penalty_amount_pd <> 0 
or bond_interest_pd <> 0 or other_amount_pd <> 0)
and ba.balance_dt >= @begin_date
and ba.balance_dt <= @end_date
group by trans_group_type, saa.assessment_type_cd


select IP_type, sum(delinquent_penalty) delq_pen, sum(delinquent_interest) delq_int,
	sum(bond_interest) bond_int, sum(refund_interest) ref_int
from #tmp
group by IP_type

GO

