create view [dbo].[payment_receipt_general_vw]

as

SELECT 
p.payment_id, 
p.receipt_num, 
case when 'PostDate' =
	(select szConfigValue from pacs_config with(nolock)
	 where szGroup = 'Receipt' and szConfigName = 'PrintDate') 
	then p.post_date else p.date_paid end AS receipt_date,
pc.pay_type_desc AS payment_code, 
p.payee_id, 
isnull(p.payee_name, '') as payee_name,
case when isnull(p.payee_id, 0) > 0 then isnull(paa.addr_line1, '') else isnull(p.bill_address1, '') end as payee_addr1,
case when isnull(p.payee_id, 0) > 0 then isnull(paa.addr_line2, '') else isnull(p.bill_address2, '') end as payee_addr2,
case when isnull(p.payee_id, 0) > 0 then isnull(paa.addr_line3, '') else isnull(p.bill_address3, '') end as payee_addr3,
case when isnull(p.payee_id, 0) > 0 then isnull(paa.addr_city, '') else isnull(p.bill_city, '') end as payee_city,
case when isnull(p.payee_id, 0) > 0 then isnull(paa.addr_state, '') else isnull(p.bill_state, '') end as payee_state,
case when isnull(p.payee_id, 0) > 0 then isnull(paa.addr_zip, '') else isnull(p.bill_zip, '') end as payee_zip,
isnull(paa.is_international, convert(bit, 0)) AS is_international, 
paa.country_cd,
p.pacs_user_id AS operator_id, 
pu.pacs_user_name AS operator_name,
pu.full_name AS operator_full_name, 
p.batch_id, 
b.description AS batch_description,
p.voided, 
p.void_date, 
p.paid_under_protest,

cast (
	case when exists (
		select 1 from payment_transaction_assoc pta with(nolock)
		where pta.payment_id = p.payment_id
		and pta.treasurer_rcpt_number is not null )
	and not exists (
		select 1 from payment_transaction_assoc pta with(nolock)
		where pta.payment_id = p.payment_id
		and pta.treasurer_rcpt_number is null )
	then 1 else 0 end 
as bit) has_only_misc_receipts

  FROM payment p WITH (NOLOCK)
    LEFT OUTER JOIN account pa WITH (NOLOCK)
      ON pa.acct_id = p.payee_id
    LEFT OUTER JOIN [address] paa WITH (NOLOCK)
      ON paa.acct_id = p.payee_id and paa.primary_addr = 'Y'
    LEFT OUTER JOIN payment_code pc WITH (NOLOCK)
      ON pc.pay_type_cd = p.payment_code
    LEFT OUTER JOIN batch b WITH (NOLOCK)
      ON b.batch_id = p.batch_id
    LEFT OUTER JOIN pacs_user pu WITH (NOLOCK)
      ON pu.pacs_user_id = p.pacs_user_id

GO

