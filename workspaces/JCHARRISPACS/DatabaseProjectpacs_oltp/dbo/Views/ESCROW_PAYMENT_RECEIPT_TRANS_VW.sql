

create view ESCROW_PAYMENT_RECEIPT_TRANS_VW
as
select
	escrow_trans.escrow_transaction_id, 
	escrow_trans.prop_id, escrow_trans.year, 
	escrow_trans.amount, escrow_trans.status, escrow.receipt_id, 
	escrow.batch_id, batch1.description, escrow.user_id, 
	pacs_user.pacs_user_name, escrow.amount_paid, 
	escrow.date_paid, escrow.post_date, escrow.payment_method, 
	payment_method.payment_desc, escrow.check_num, 
	escrow.dl_number, escrow.dl_state, escrow.dl_exp_date, 
	escrow.void_payment, escrow.void_date, escrow.void_reason, 
	escrow.void_batch_id, escrow.voided_by_user, 
	escrow_trans.escrow_id, escrow.owner_id, escrow.payee_id, 
	pacs_user1.pacs_user_name AS voided_by_user_name, 
	batch1.description AS voided_batch_id_desc, 
	escrow.amount_due, escrow.override_amount_due, 
	escrow.penalty, escrow.override_penalty, escrow.fines, 
	escrow.escrow_type, escrow_trans.month, batch1.balance_dt, 
	account.file_as_name, address.addr_line1, 
	address.addr_line2, address.addr_line3, address.addr_city, 
	address.addr_state, address.addr_zip,
	cast(isnull(address.is_international, 0) as bit) as is_international,
	address.country_cd,
	case
		when escrow.payee_id > 0 then payer_account.file_as_name
		else escrow.paid_by
	end as payer_file_as_name,
	payer_address.addr_line1 AS payer_addr_line1, 
	payer_address.addr_line2 AS payer_addr_line2, 
	payer_address.addr_line3 AS payer_addr_line3, 
	payer_address.addr_city AS payer_addr_city, 
	payer_address.addr_state AS payer_addr_state, 
	payer_address.addr_zip AS payer_addr_zip, 
	cast(isnull(payer_address.is_international, 0) as bit) as payer_addr_is_international,
	payer_address.country_cd as payer_addr_country_cd,
	GET_LEGAL_DESC_VW.legal_desc, 
	GET_LEGAL_DESC_VW.geo_id, 
	VIT_SALES_VW.total_sales
from vit_sales_vw
join escrow_trans on
	vit_sales_vw.prop_id = escrow_trans.prop_id and
	vit_sales_vw.year = escrow_trans.year and
	vit_sales_vw.month = escrow_trans.month
left outer join get_legal_desc_vw on
	escrow_trans.prop_id = get_legal_desc_vw.prop_id
join escrow on
	escrow_trans.escrow_id = escrow.escrow_payment_id
join batch on
	escrow.batch_id = batch.batch_id
left outer join account as payer_account on
	escrow.payee_id = payer_account.acct_id
left outer join address as payer_address on
	payer_account.acct_id = payer_address.acct_id and
	payer_address.primary_addr = 'Y'
join pacs_user on
	escrow.user_id = pacs_user.pacs_user_id
join payment_method on
	escrow.payment_method = payment_method.payment_cd
join account as account on
	escrow.owner_id = account.acct_id
join address as address on
	account.acct_id = address.acct_id and
	address.primary_addr = 'Y'
left outer join batch as batch1 on
	escrow.void_batch_id = batch1.batch_id
left outer join pacs_user as pacs_user1 on
	escrow.voided_by_user = pacs_user1.pacs_user_id
where
	escrow_trans.status like 'VE%'

GO

