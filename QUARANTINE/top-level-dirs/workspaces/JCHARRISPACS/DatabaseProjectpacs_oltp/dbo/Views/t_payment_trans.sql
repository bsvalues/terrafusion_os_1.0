



/****** Object:  View dbo.t_payment_trans    Script Date: 1/17/00 9:53:06 AM ******/
CREATE VIEW dbo.t_payment_trans
AS
SELECT payment.payment_id, 
    SUM(payment_trans.fee_amt + payment_trans.mno_amt + payment_trans.ins_amt
     + payment_trans.penalty_mno_amt + payment_trans.penalty_ins_amt
     + payment_trans.interest_mno_amt + payment_trans.interest_ins_amt
     + payment_trans.attorney_fee_amt + payment_trans.overage_mno_amt
      + payment_trans.overage_ins_amt) AS trans_amt
FROM payment INNER JOIN
    payment_trans ON 
    payment.payment_id = payment_trans.payment_id INNER JOIN
    batch ON payment.batch_id = batch.batch_id
where  batch.balance_dt >= '02/01/2001'
and  batch.balance_dt <= '02/28/2001'


GROUP BY payment.payment_id

GO

