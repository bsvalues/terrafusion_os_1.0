




CREATE VIEW dbo.refund_year_to_date_vw
AS
SELECT refund.batch_id, refund.date_refunded, 
    batch.batch_id AS Expr1, batch.balance_dt, 
    refund_trans.refund_amt AS refund_amt, refund_trans.bill_id, 
    refund_trans.transaction_id, refund_trans.refund_id, 
    refund_trans.fee_id, bill.sup_tax_yr, bill.entity_id
FROM refund INNER JOIN
    refund_trans ON 
    refund.refund_id = refund_trans.refund_id INNER JOIN
    batch ON refund.batch_id = batch.batch_id INNER JOIN
    bill ON refund_trans.bill_id = bill.bill_id

GO

