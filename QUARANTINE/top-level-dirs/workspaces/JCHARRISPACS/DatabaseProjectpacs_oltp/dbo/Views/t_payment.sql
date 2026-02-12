



/****** Object:  View dbo.t_payment    Script Date: 1/17/00 9:53:06 AM ******/
CREATE view t_payment
as
select payment.payment_id, payment_type, payment_code, operator_id, (cash_amt + check_amt + mo_amt) as payment_amt
from payment, batch
where payment.batch_id = batch.batch_id
and   payment.batch_id = batch.batch_id
and  batch.balance_dt >= '02/01/2001'
and  batch.balance_dt <= '02/28/2001'

GO

