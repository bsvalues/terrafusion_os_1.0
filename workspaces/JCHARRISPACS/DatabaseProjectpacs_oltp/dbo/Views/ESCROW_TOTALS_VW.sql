












CREATE VIEW dbo.ESCROW_TOTALS_VW
AS
SELECT escrow_trans.prop_id, escrow_trans.year, 
    SUM(escrow.amount_due) AS total_escrow_due, 
    SUM(escrow.penalty + escrow.fines) AS total_penalty_fines, 
    SUM(escrow.amount_paid) AS total_amount_paid, 
    escrow_trans.month, escrow_trans.status, 
    SUM(escrow.amount_paid) 
    - SUM(escrow.penalty + escrow.fines) AS total_vit_paid
FROM escrow INNER JOIN
    escrow_trans ON 
    escrow.escrow_payment_id = escrow_trans.escrow_id
GROUP BY escrow_trans.prop_id, escrow_trans.year, 
    escrow_trans.month, escrow_trans.status, escrow.amount_paid

GO

