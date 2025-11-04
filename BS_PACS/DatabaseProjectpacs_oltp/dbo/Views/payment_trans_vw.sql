


CREATE VIEW dbo.payment_trans_vw
AS
SELECT bill.sup_num, bill.sup_tax_yr, supplement.sup_group_id, 
    bill.prev_bill_id, bill.new_bill_id, payment_trans.mno_amt, 
    payment_trans.ins_amt, payment_trans.penalty_mno_amt, 
    payment_trans.penalty_ins_amt, 
    payment_trans.interest_mno_amt, 
    payment_trans.interest_ins_amt, 
    payment_trans.attorney_fee_amt, 
    payment_trans.discount_mno_amt, 
    payment_trans.discount_ins_amt, bill.bill_id, 
    payment.post_date, payment.date_paid, bill.entity_id, 
    bill.prop_id, entity.entity_cd, bill.stmnt_id, 
    payment_trans.transaction_id, payment_trans.payment_id, 
    payment.payment_type, payment.void_by_id, 
    payment.void_date, payment.void_payment, 
    payment.void_reason, payment.void_batch_id, 
    payment_trans.q4_amt, payment_trans.q3_amt, 
    payment_trans.q2_amt, payment_trans.q1_amt, 
    payment_trans.overage_ins_amt, 
    payment_trans.overage_mno_amt, 
    payment_trans.underage_ins_amt, 
    payment_trans.underage_mno_amt
FROM payment_trans INNER JOIN
    bill ON payment_trans.bill_id = bill.prev_bill_id INNER JOIN
    payment ON 
    payment_trans.payment_id = payment.payment_id INNER JOIN
    entity ON bill.entity_id = entity.entity_id INNER JOIN
    supplement ON bill.sup_num = supplement.sup_num AND 
    bill.sup_tax_yr = supplement.sup_tax_yr

GO

