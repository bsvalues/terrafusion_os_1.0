
CREATE PROCEDURE IALM
	@id1 int,
	@id2 int
AS

IF @id1 <> 0
BEGIN
	SELECT	ia.ia_id as AGREEMENT_ID,
		case when account.confidential_file_as_name is not null then account.confidential_file_as_name
	    		else ISNULL(account.file_as_name, '') end AS ACCOUNT_NAME,
	    dbo.fn_Address(
			coalesce(account.confidential_file_as_name, account.file_as_name, ''), 
			address.addr_line1,
			address.addr_line2,
			address.addr_line3,
			address.addr_city,
			address.addr_state,
			address.addr_zip,
			address.country_cd,
			address.is_international,
			5
		) as ACCOUNT_ADDRESS,
		dbo.fn_Address(
			coalesce(account.confidential_file_as_name, account.file_as_name, ''), 
			address.addr_line1,
			address.addr_line2,
			address.addr_line3,
			address.addr_city,
			address.addr_state,
			address.addr_zip,
			address.country_cd,
			address.is_international,
			5
		) as ACCOUNT_ADDRESS_5LINES,
		dbo.fn_Address(
			coalesce(account.confidential_file_as_name, account.file_as_name, ''), 
			address.addr_line1,
			address.addr_line2,
			address.addr_line3,
			address.addr_city,
			address.addr_state,
			address.addr_zip,
			address.country_cd,
			address.is_international,
			6
		) as ACCOUNT_ADDRESS_6LINES,
		ISNULL(address.addr_line1, '') AS ADDR_LINE1,
		ISNULL(address.addr_line2, '') AS ADDR_LINE2,
		ISNULL(address.addr_line3, '') AS ADDR_LINE3,
		ISNULL(address.addr_city, '') AS ADDR_CITY,
		ISNULL(address.addr_state, '') AS ADDR_STATE,
		ISNULL(address.addr_zip, '') AS ADDR_ZIP,
		ISNULL(address.country_cd, '') AS ADDR_COUNTRY,
		ISNULL(address.zip,'') as ZIP,
		ISNULL(address.cass,'') as CASS,
		ISNULL(address.route,'') as ROUTE,
		ISNULL(address.zip_4_2,'') as ZIP_BARCODE,
		ISNULL(pacs_user_1.pacs_user_name, '') AS CREATED_BY,
		CONVERT(varchar(10), ia.ia_create_dt, 101) AS CREATE_DATE,
		CONVERT(varchar(10), ia.ia_start_dt, 101) AS START_DATE,
		ISNULL(ia.ia_ref_num, '') AS REFERENCE_NUMBER,
		ISNULL(ia.ia_num_months, 0) AS NUMBER_MONTHS,
		ISNULL(ia.ia_payment_terms, '') AS PAYMENT_TERMS,
		ISNULL(ia.ia_payment_amt, 0) AS PAYMENT_AMOUNT,
		ISNULL(ia.ia_status, '') AS STATUS,
		ISNULL(ia.ia_default_comment, '') AS DEFAULT_COMMENT,
		ISNULL(pacs_user_2.pacs_user_name, '') AS DEFAULT_USER,
		CONVERT(varchar(10), ia.ia_default_dt, 101) AS DEFAULT_DATE,
		ISNULL(ia.ia_sched_type, '') AS SCHEDULE_TYPE

	FROM	installment_agreement ia

	LEFT OUTER JOIN	account
	ON		ia.ia_acct_id = account.acct_id

	LEFT OUTER JOIN address
	ON		account.acct_id = address.acct_id
	AND		address.primary_addr = 'Y'

	LEFT OUTER JOIN pacs_user as pacs_user_1
	ON		ia.ia_create_user = pacs_user_1.pacs_user_id

	LEFT OUTER JOIN pacs_user as pacs_user_2
	ON		ia.ia_default_user = pacs_user_2.pacs_user_id

	WHERE	ia.ia_id = @id1
END
ELSE
BEGIN
	SELECT	'ID' AS AGREEMENT_ID,
		'Account Name' AS ACCOUNT_NAME,
		'Account''s Name and Address' AS ACCOUNT_ADDRESS,
		'Account''s Name and Address (5 lines)' AS ACCOUNT_ADDRESS,
		'Address Line1' AS ADDR_LINE1,
		'Address Line2' AS ADDR_LINE2,
		'Address Line3' AS ADDR_LINE3,
		'Address City'  AS ADDR_CITY,
		'Address State' AS ADDR_STATE,	
                'Address Zip'   AS ADDR_ZIP,
		'Address Country' AS ADDR_COUNTRY,	
		'Zip' AS ZIP,
		'CASS' AS CASS,
		'Route' AS ROUTE,
  		'ZIP_BARCODE' AS ZIP_BARCODE,	
		'Created By' AS CREATED_BY,
		'Create Date' AS CREATE_DATE,
		'Start Date' AS START_DATE,
		'Reference Number' AS REFERENCE_NUMBER,
		'Months' AS NUMBER_MONTHS,
		'Payment Terms' AS PAYMENT_TERMS,
		'Payment Amount' AS PAYMENT_AMOUNT,
		'Status' AS STATUS,
		'Default Comment' AS DEFAULT_COMMENT,
		'Default Set By' AS DEFAULT_USER,
		'Default Date' AS DEFAULT_DATE,
		'Schedule Type' AS SCHEDULE_TYPE
END

GO

