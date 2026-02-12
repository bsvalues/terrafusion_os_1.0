    
    
    
    
---here is how you set up the monitor call:  {Call SAPaymentsByDate ('12/8/2016')}    
      
          
          
CREATE procedure [dbo].[SAPaymentsByDate]          
          
          
@balance_dt		datetime          
          
          
          
          
as          
          
          
          
set nocount on          
          


select p.geo_id, saa.agency_id, saa.assessment_description, b.display_year, ba.balance_dt, pta.payment_id, 
	sum(ct.base_amount_pd) sa_paid, sum(ct.interest_amount_pd) int_paid, sum(ct.penalty_amount_pd) pen_paid,
	sum(isnull(f.fees_paid, 0)) fees_paid
from bill b with(nolock)
join property p with(nolock)
	on p.prop_id = b.prop_id
join assessment_bill ab with(nolock)
	on ab.bill_id = b.bill_id
join special_assessment_agency saa with(nolock)
	on saa.agency_id = ab.agency_id
join coll_transaction ct with(nolock)
	on ct.trans_group_id = b.bill_id
join payment_transaction_assoc pta with(Nolock)
	on pta.transaction_id = ct.transaction_id
join batch ba with(nolock)
	on ba.batch_id = ct.batch_id
left join (select bfa.bill_id, ptaf.payment_id, 
	sum(ctf.base_amount_pd + ctf.interest_amount_pd + ctf.penalty_amount_pd) fees_paid
	from bill_fee_assoc bfa with(nolock)
	join fee f with(nolock)
		on f.fee_id = bfa.fee_id
	join coll_transaction ctf with(nolock)
		on ctf.trans_group_id = f.fee_id
	join payment_transaction_assoc ptaf with(nolock)
		on ptaf.transaction_id = ctf.transaction_id
	join batch ba2 with(nolock)
		on ba2.batch_id = ctf.batch_id
	where ba2.balance_dt = @balance_dt
	group by bfa.bill_id, ptaf.payment_id) f
	on f.bill_id = b.bill_id
	and f.payment_id = pta.payment_id
where ba.balance_dt = @balance_dt
group by p.geo_id, saa.agency_id, saa.assessment_description, b.display_year, ba.balance_dt, pta.payment_id
order by pta.payment_id, saa.agency_id

set nocount off

GO

