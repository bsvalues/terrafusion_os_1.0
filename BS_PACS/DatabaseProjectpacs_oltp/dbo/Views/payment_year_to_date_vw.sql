


CREATE VIEW dbo.payment_year_to_date_vw
AS
SELECT batch.batch_id, batch.balance_dt, batch.description, 
    payment.payment_id, payment_trans.mno_amt, 
    payment_trans.ins_amt, payment_trans.penalty_mno_amt, 
    payment_trans.penalty_ins_amt, 
    payment_trans.interest_mno_amt, 
    payment_trans.interest_ins_amt, 
    payment_trans.attorney_fee_amt, 
    payment_trans.discount_ins_amt, 
    payment_trans.discount_mno_amt, bill.entity_id, 
    bill.sup_tax_yr, payment_trans.q1_amt, 
    payment_trans.q2_amt, payment_trans.q3_amt, 
    payment_trans.q4_amt, payment_trans.underage_mno_amt, 
    payment_trans.underage_ins_amt, 
    payment_trans.overage_mno_amt, 
    payment_trans.overage_ins_amt, 
    payment_trans.refund_mno_amt, 
    payment_trans.refund_ins_amt
FROM batch INNER JOIN
    payment ON batch.batch_id = payment.batch_id INNER JOIN
    payment_trans ON 
    payment.payment_id = payment_trans.payment_id INNER JOIN
    bill ON payment_trans.bill_id = bill.bill_id

GO

