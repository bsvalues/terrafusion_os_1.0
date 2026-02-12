


create view attorney_fee_rpt_vw

as

select entity.entity_id, entity.entity_cd, account.file_as_name, 
bill.sup_tax_yr, batch.balance_dt, attorney_fee_amt
from bill, batch, payment p, payment_trans pt,
     entity, account
where p.payment_id = pt.payment_id
and   p.batch_id = batch.batch_id
and   pt.bill_id = bill.bill_id 
and   pt.attorney_fee_amt <> 0
and   bill.entity_id = entity.entity_id
and   bill.entity_id = account.acct_id

GO

