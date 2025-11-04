

CREATE VIEW PROPERTY_ESCROW_TRANSACTION_VW
AS
SELECT
	escrow_trans.escrow_transaction_id, escrow.date_paid, 
	escrow.post_date, escrow.amount_paid, escrow.receipt_id,
	case
		when escrow.payee_id > 0 then account.file_as_name
		else escrow.paid_by
	end as file_as_name,
	escrow_trans.prop_id,
	escrow_trans.owner_id, escrow_trans.year, 
	escrow_trans.status, escrow_trans.month, escrow.penalty, 
	escrow.fines
FROM escrow
INNER JOIN escrow_trans ON 
	escrow.escrow_payment_id = escrow_trans.escrow_id
left outer join account ON
	escrow.payee_id = account.acct_id

GO

