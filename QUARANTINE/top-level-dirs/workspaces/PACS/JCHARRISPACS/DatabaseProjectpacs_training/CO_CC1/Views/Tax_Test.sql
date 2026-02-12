CREATE VIEW [CO\CC1].Tax_Test AS SELECT
payment.payment_id, payment.receipt_num, payment.amount_due, payment.amount_paid, date_paid, payment.payee_name, payment_transaction_assoc.prop_id
FROM payment 
JOIN payment_transaction_assoc
ON [payment].payment_id = [payment_transaction_assoc].payment_id

GO

