


CREATE VIEW dbo.payment_bill_recap_vw
AS
SELECT bill.sup_num, bill.sup_tax_yr, supplement.sup_group_id, 
    bill.prev_bill_id, bill.new_bill_id, 
    SUM(payment_trans.mno_amt) AS sum_mno_amt, 
    SUM(payment_trans.ins_amt) AS sum_ins_amt, 
    SUM(payment_trans.penalty_mno_amt) 
    AS sum_penalty_mno_amt, 
    SUM(payment_trans.penalty_ins_amt) 
    AS sum_penalty_ins_amt, 
    SUM(payment_trans.interest_mno_amt) 
    AS sum_interest_mno_amt, 
    SUM(payment_trans.interest_ins_amt) 
    AS sum_interest_ins_amt, 
    SUM(payment_trans.attorney_fee_amt) 
    AS sum_attorney_fee_amt, 
    SUM(payment_trans.discount_mno_amt) 
    AS sum_discount_mno_amt, 
    SUM(payment_trans.discount_ins_amt) 
    AS sum_discount_ins_amt, bill.bill_id
FROM supplement INNER JOIN
    bill ON supplement.sup_num = bill.sup_num AND 
    supplement.sup_tax_yr = bill.sup_tax_yr INNER JOIN
    payment_trans ON 
    bill.prev_bill_id = payment_trans.bill_id
GROUP BY bill.sup_num, bill.sup_tax_yr, 
    supplement.sup_group_id, bill.prev_bill_id, bill.new_bill_id, 
    bill.bill_id

GO

