


CREATE VIEW dbo.VIT_PAYMENT_VW
AS
SELECT escrow_trans.prop_id, escrow_trans.year, 
    SUM(escrow.amount_paid) - SUM(escrow.penalty) 
    - SUM(escrow.fines) AS amount_paid
FROM escrow INNER JOIN
    escrow_trans ON 
    escrow.escrow_payment_id = escrow_trans.escrow_transaction_id
GROUP BY escrow_trans.prop_id, escrow_trans.year

GO

