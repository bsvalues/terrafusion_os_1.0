
CREATE PROCEDURE ACCTLM

	@id1 int,
	@id2 int

AS

--Version Info
--1.0 Created
--1.1 Revised EricZ 01/21/2004, added various phone number tags; HelpSTAR #11748

IF @id1 > 0
BEGIN
	--Get various phone numbers for account
	declare @acct_phone_business 	as varchar(20)
	declare @acct_phone_business2 	as varchar(20)
	declare @acct_phone_cell 	as varchar(20)
	declare @acct_phone_fax 	as varchar(20)
	declare @acct_phone_home 	as varchar(20)
	declare @acct_phone_home2 	as varchar(20)

	select @acct_phone_business = phone_num from phone with (nolock) where acct_id = @id1 and phone_type_cd = 'B'
	select @acct_phone_business2= phone_num from phone with (nolock) where acct_id = @id1 and phone_type_cd = 'B2'
	select @acct_phone_cell 	= phone_num from phone with (nolock) where acct_id = @id1 and phone_type_cd = 'C'

	select @acct_phone_fax 		= phone_num from phone with (nolock) where acct_id = @id1 and phone_type_cd = 'F'
	select @acct_phone_home 	= phone_num from phone with (nolock) where acct_id = @id1 and phone_type_cd = 'H'
	select @acct_phone_home2 	= phone_num from phone with (nolock) where acct_id = @id1 and phone_type_cd = 'H2'

	SELECT 
		account.acct_id 					as ACCOUNT_ID,
		isnull(account.confidential_file_as_name, account.file_as_name)	as ACCOUNT_NAME,
		account.first_name 					as FIRST_NAME,
		account.last_name 					as LAST_NAME,
		dbo.fn_Address(
			isnull(account.confidential_file_as_name, account.file_as_name), 
			address.addr_line1,
			address.addr_line2,
			address.addr_line3,
			address.addr_city,
			address.addr_state,
			address.addr_zip,
			country.country_name,
			address.is_international,
			5
		) as NAME_ADDRESS,
		dbo.fn_Address(
			isnull(account.confidential_file_as_name, account.file_as_name), 
			address.addr_line1,
			address.addr_line2,
			address.addr_line3,
			address.addr_city,
			address.addr_state,
			address.addr_zip,
			country.country_name,
			address.is_international,
			5
		) as NAME_ADDRESS_5LINES,
		dbo.fn_Address(
			isnull(account.confidential_file_as_name, account.file_as_name), 
			address.addr_line1,
			address.addr_line2,
			address.addr_line3,
			address.addr_city,
			address.addr_state,
			address.addr_zip,
			country.country_name,
			address.is_international,
			6
		) as NAME_ADDRESS_6LINES,
		ISNULL(address.addr_line1,'') 		as ADDR_LINE1,
		ISNULL(address.addr_line2,'') 		as ADDR_LINE2,
		ISNULL(address.addr_line3,'') 		as ADDR_LINE3,
		ISNULL(address.addr_city,'') 		as ADDR_CITY,
		ISNULL(address.addr_state,'') 		as ADDR_STATE,
		ISNULL(address.addr_zip,'') 		as ADDR_ZIP,
		ISNULL(address.country_cd,'') 		as ADDR_COUNTRY,
		ISNULL(country.country_name,'')		as ADDR_COUNTRY_DESC,
		ISNULL(address.is_international, 0)	as ADDR_IS_INTERNATIONAL,
		ISNULL(address.zip,'')              as ZIP,
		ISNULL(address.cass,'')				as CASS,
		ISNULL(address.route,'')			as ROUTE,
		ISNULL(address.zip_4_2,'')          as ZIP_BARCODE,
		ISNULL(phone.phone_num,'') 			as PHONE_NUMBER,
		ISNULL(account.email_addr,'') 		as EMAIL,
		ISNULL(account.comment,'') 			as COMMENT,
		ISNULL(@acct_phone_business, '')	as PHONE_BUSINESS,
		ISNULL(@acct_phone_business2, '') 	as PHONE_BUSINESS2,
		ISNULL(@acct_phone_cell, '') 		as PHONE_CELL,
		ISNULL(@acct_phone_fax, '') 		as PHONE_FAX,
		ISNULL(@acct_phone_home, '') 		as PHONE_HOME,
		ISNULL(@acct_phone_home2, '') 		as PHONE_HOME2,
		year(aphd.docket_start_date_time)   as AGENT_HEARING_YEAR,
		convert(varchar(10), aphd.docket_start_date_time, 101) as AGENT_HEARING_DATE,
		right(convert(varchar(30), aphd.docket_start_date_time),7) as AGENT_HEARING_TIME

	FROM account
	with (nolock)

	LEFT OUTER JOIN address
	with (nolock)
	ON account.acct_id = address.acct_id
	AND address.primary_addr = 'Y'

	LEFT OUTER JOIN country
	with (nolock)
	on country.country_cd = address.country_cd

	LEFT OUTER JOIN phone
	with (nolock)
	ON account.acct_id = phone.acct_id
	AND phone.phone_type_cd = 'B'

	LEFT OUTER JOIN agent
	with (nolock)
	on account.acct_id = agent.agent_id

	LEFT OUTER JOIN _arb_protest_hearing_docket as aphd
	with (nolock)
	on agent.arb_docket_id = aphd.docket_id

	WHERE account.acct_id = @id1
END
ELSE
BEGIN
	SELECT 'Account ID' 				as ACCOUNT_ID,
		'Account Name' 					as ACCOUNT_NAME,
		'First Name' 					as FIRST_NAME,
		'Last Name' 					as LAST_NAME,
		'Account''s Name and Address (5 lines)' as NAME_ADDRESS,
		'Account''s Name and Address (6 lines - Intl)' as NAME_ADDRESS_6LINES,
		'Address Line 1' 				as ADDR_LINE1,
		'Address Line 2'				as ADDR_LINE2,
		'Address Line 3'				as ADDR_LINE3,
		'Address City'					as ADDR_CITY,
		'Address State'					as ADDR_STATE,
		'Address Zip'					as ADDR_ZIP,
		'Address Country'				as ADDR_COUNTRY,
		'Address Country Desc'			as ADDR_COUNTRY_DESC,
		'zip'							as ZIP,					
		'cass'							as CASS,	
		'route'							as ROUTE,	
		'zip_barcode'			        as ZIP_BARCODE,		
		'Phone Number' 					as PHONE_NUMBER,
		'Email Address' 				as EMAIL,
		'Comment' 						as COMMENT,
		'Phone Business' 	 			as PHONE_BUSINESS,
		'Phone Business 2' 				as PHONE_BUSINESS2,
		'Phone Cell' 	 				as PHONE_CELL,
		'Phone Fax' 	 				as PHONE_FAX,
		'Phone Home' 	 				as PHONE_HOME,
		'Phone Home 2' 	 				as PHONE_HOME2,
		'Agent Hearing Year'			as AGENT_HEARING_YEAR,
		'Agent Hearing Date'			as AGENT_HEARING_DATE,
		'Agent Hearing Time'			as AGENT_HEARING_TIME
END

GO

