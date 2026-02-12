

CREATE VIEW escrow_payment_trans_vw
AS
SELECT DISTINCT escrow_trans.escrow_transaction_id, 
	escrow_trans.prop_id,
	escrow_trans.year, 
	escrow_trans.amount,
	escrow_status.escrow_status_desc, 
	escrow_trans.status,
	escrow.receipt_id,
	escrow.batch_id, 
	batch.description, 
	account.file_as_name AS owner_file_as_name, 
	escrow.user_id,
	pacs_user.pacs_user_name, 
	escrow.amount_paid,
	escrow.date_paid,
	escrow.post_date, 
	escrow.payment_method,
	payment_method.payment_desc, 
	escrow.check_num,
	escrow.dl_number,
	escrow.dl_state, 
	escrow.dl_exp_date,
	escrow.void_payment,
	escrow.void_date, 
	escrow.void_reason,
	escrow.void_batch_id, 
	escrow.voided_by_user,
	escrow_trans.escrow_id,
	ISNULL(escrow.paid_by, account.file_as_name) AS payee_file_as_name, 
	escrow.owner_id,
	escrow.payee_id, 
	pacs_user1.pacs_user_name AS voided_by_user_name, 
	batch1.description AS voided_batch_id_desc, 
	escrow.amount_due,
	escrow.override_amount_due, 
	escrow.penalty,
	escrow.override_penalty,
	escrow.fines, 
	escrow.escrow_type,
	escrow_trans.month,
	batch.balance_dt, 
	batch1.balance_dt AS void_balance_dt,
	ISNULL(escrow.paid_by, account.file_as_name) as taxpayer -- HS 13392 added a taxpayer column to show the escrow paid by..PratimaV
FROM dbo.batch INNER JOIN dbo.escrow_trans
	INNER JOIN dbo.escrow_status
		ON dbo.escrow_trans.status = dbo.escrow_status.escrow_status_cd
	INNER JOIN dbo.escrow 
		ON dbo.escrow_trans.escrow_id = dbo.escrow.escrow_payment_id
		ON dbo.batch.batch_id = dbo.escrow.batch_id
	INNER JOIN dbo.pacs_user 
		ON dbo.escrow.user_id = dbo.pacs_user.pacs_user_id
	INNER JOIN dbo.payment_method 
		ON dbo.escrow.payment_method = dbo.payment_method.payment_cd
	INNER JOIN dbo.account 
		ON dbo.escrow.owner_id = dbo.account.acct_id
	LEFT OUTER JOIN dbo.pacs_user pacs_user1
		ON dbo.escrow.voided_by_user = pacs_user1.pacs_user_id
	LEFT OUTER JOIN	dbo.batch batch1 
		ON dbo.escrow.void_batch_id = batch1.batch_id

GO

