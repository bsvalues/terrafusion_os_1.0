

/*
Jeremy Wilson 34585 changes
The stored procedure wasn't designed is a fashion consistent with the original
way multi-line address tags were intended to be processed by the word merge classes.

Even more so, it appears the stored procedure was left half done since no alias name 
select statement was put in place to make nice with the word merge tree view.

So I decided to add the code to comply with that standard while I was in here adding stuff
for this ticket.  I also refactored some code where necessary to bring ARB letters more
into compliance with the way the Word Merge Letters Processing works.
*/

CREATE PROCEDURE ARBNOPHM

	@case_id int,
	@ID1 int,
	@ID2 int = NULL
with recompile
as

IF @case_id > 0
BEGIN
	/*	Why did the original designer put this stuff in here?  There's a stored procedure
		(LetterMergeSystemAddress) and a whole set of code already in place to include 
		system address tags in word merge letters!
		Oh well...gotta keep it I guess for backwards compatibility. 
		I added an entry to the letter_sp_list table to handle this though.
	*/
	declare @sys_addr_line1 	varchar (50) 
	declare @sys_addr_line2 	varchar (50) 
	declare @sys_addr_line3 	varchar (50) 
	declare @sys_addr_city 		varchar (50) 
	declare @sys_addr_state 	char (2) 
	declare @sys_addr_zip 		varchar (50) 
	declare @cad_id_code		char (3) 
	declare @sys_phone_num 		varchar (25) 
	declare @sys_phone_num2 	varchar (25) 
	declare @sys_fax_num 		varchar (25) 
	declare @chief_appraiser	varchar (50) 
	declare @county_name 		varchar (30) 
	declare @office_name 		varchar (50) 
	declare @url 				varchar (50) 

	SELECT
		@sys_addr_line1 	= addr_line1,
		@sys_addr_line2 	= addr_line2,
		@sys_addr_line3 	= addr_line3,
		@sys_addr_city 		= city,
		@sys_addr_state 	= state,
		@sys_addr_zip 		= zip,
		@cad_id_code		= cad_id_code,
		@sys_phone_num 		= phone_num,
		@sys_phone_num2		= phone_num2,
		@sys_fax_num		= fax_num,
		@chief_appraiser	= chief_appraiser,
		@county_name		= county_name,
		@office_name		= office_name,
		@url 				= url
	FROM 
		system_address	WITH (NOLOCK)
	WHERE 
		system_type in ('A', 'B')


	DECLARE @prop_val_yr int
	--	DECLARE @prot_by_id int  <-- its never used... 
	-- declare @prop_id int		 <-- its never used... 
	declare @lProtestByID int

	if @ID2 IS NULL 
	begin
		set @prop_val_yr = @ID1
		SELECT
			@lProtestByID = appba.prot_by_id
		FROM				
			_arb_protest as ap WITH (NOLOCK)
		INNER JOIN			
			_arb_protest_protest_by_assoc as appba WITH (NOLOCK) 
		ON		
					appba.case_id = ap.case_id
			AND		appba.prop_val_yr = ap.prop_val_yr
			AND		appba.primary_protester = 1
		WHERE
					ap.case_id = @case_id
		AND			ap.prop_val_yr = @prop_val_yr
	end
	else
	begin
		set @prop_val_yr = @ID2
		set @lProtestByID = @ID1
	end

	-- get the protest by address information
	declare @file_as_name		varchar (70)
	declare @addr_line_1		varchar	(60)
	declare @addr_line_2		varchar	(60)
	declare @addr_line_3		varchar	(60)
	declare @addr_city			varchar	(50)
	declare @addr_state			varchar	(50)
	declare @addr_zip			varchar	(14)
	declare @addr_country_cd	char	(5)
	declare @addr_country_name	varchar	(60)
	declare	@addr_is_international bit
	declare @addr_short_zip		varchar (5)
	declare @addr_cass			varchar (4)
	declare @addr_route			varchar (2)
	declare @addr_barcode		varchar (14)		

	declare @full_addr			varchar	(400)

	SELECT 
		@file_as_name		= rtrim(isnull(a.confidential_file_as_name, a.file_as_name)),
		@addr_line_1		= rtrim(isnull(ad.addr_line1, '')),
		@addr_line_2		= rtrim(isnull(ad.addr_line2, '')),
		@addr_line_3		= rtrim(isnull(ad.addr_line3, '')),
		@addr_city		= rtrim(isnull(ad.addr_city, '')),
		@addr_state		= rtrim(isnull(ad.addr_state, '')),
		@addr_zip		= rtrim(isnull(ad.addr_zip, '')),
		@addr_country_cd	= rtrim(isnull(ad.country_cd, '')),
		@addr_country_name	= rtrim(isnull(country.country_name, '')),
		@addr_is_international	= isnull(ad.is_international, 0),
		@addr_short_zip		= ad.zip,
		@addr_cass		= ad.cass,
		@addr_route		= ad.route,
		@addr_barcode		= ad.zip_4_2
	FROM
		account	AS a WITH (nolock)
	LEFT OUTER JOIN 		
		address AS ad WITH (nolock)
		LEFT OUTER JOIN 
			country WITH (nolock)
		ON
			country.country_cd = ad.country_cd
	ON
			ad.acct_id = a.acct_id
		AND	ad.primary_addr = 'Y'

	WHERE 
			a.acct_id = @lProtestByID

	-- create a full address with carriage returns
	set @full_addr = ''

	if @addr_line_1 <> ''
	begin
		set @full_addr = @full_addr + @addr_line_1 + CHAR(13)
	end

	if @addr_line_2 <> ''
	begin
		set @full_addr = @full_addr + @addr_line_2 + CHAR(13)
	end

	if @addr_line_3 <> ''
	begin
		set @full_addr = @full_addr + @addr_line_3 + CHAR(13)
	end

/*
	if @addr_city <> '' or @addr_state <> '' or @addr_zip <> ''
	begin
		set @full_addr = @full_addr + CHAR(13)
	end
	
	if @addr_city <> '' 
	begin
		set @full_addr = @full_addr + @addr_city

		if @addr_state <> ''
		begin
			set @full_addr = @full_addr + ', ' + @addr_state
		end
	end
	else
	begin
		if @addr_state <> ''
		begin
			set @full_addr = @full_addr + @addr_state
		end
	end

	if @addr_zip <> ''
	begin
		set @full_addr = @full_addr + ' ' + @addr_zip
	end
*/

	-- Select all the values for the recordset to be returned
	SELECT
		@sys_addr_line1 	as sys_addr_line1,
		@sys_addr_line2 	as sys_addr_line2,
		@sys_addr_line3 	as sys_addr_line3,
		@sys_addr_city 		as sys_city,
		@sys_addr_state 	as sys_state,
		@sys_addr_zip 		as sys_zip,
		@cad_id_code		as sys_cad_id_code,
		@sys_phone_num 		as sys_phone_num,
		@sys_phone_num2		as sys_phone_num2,
		@sys_fax_num		as sys_fax_num,
		@chief_appraiser	as sys_chief_appraiser,
		@county_name		as sys_county_name,
		@office_name		as sys_office_name,
		@url 			as sys_url,
		@case_id		as case_id,
		@lProtestByID		as prot_by_id,
		@full_addr		as addr_main,
		@file_as_name		as file_as_name,
		dbo.fn_Address(
			@file_as_name, 
			@addr_line_1,
			@addr_line_2,
			@addr_line_3,
			@addr_city,
			@addr_state,
			@addr_zip,
			@addr_country_name,
			@addr_is_international,
			5
		) 					as name_address,
		dbo.fn_Address(
			@file_as_name, 
			@addr_line_1,
			@addr_line_2,
			@addr_line_3,
			@addr_city,
			@addr_state,
			@addr_zip,
			@addr_country_name,
			@addr_is_international,
			5
		) 					as name_address_5lines,
		dbo.fn_Address(
			@file_as_name, 
			@addr_line_1,
			@addr_line_2,
			@addr_line_3,
			@addr_city,
			@addr_state,
			@addr_zip,
			@addr_country_name,
			@addr_is_international,
			6
		) 					as name_address_6lines,
		@addr_line_1		as addr_line1,
		@addr_line_2		as addr_line2,
		@addr_line_3		as addr_line3,
		@addr_city		as addr_city,
		@addr_state		as addr_state,
		@addr_zip		as addr_zip,
		@addr_country_cd	as addr_country_cd,
		@addr_country_name	as addr_country_name,
		@addr_is_international as addr_is_international,
		@addr_short_zip		as zip,
		@addr_cass		as cass,
		@addr_route		as route,
		@addr_barcode		as ZIP_BARCODE
END
ELSE
BEGIN
	SELECT
		/*
		By commenting out these fields, we eliminate the user's ability to use
		these tags in future documents in favor of using the tags from 
		LetterMergeSystemAddress.  However, we can return the actual data for these
		fields in the select statement above to maintain legacy compatibility.
		
		'System Address Line 1' 		as sys_addr_line1,
		'System Address Line 2' 		as sys_addr_line2,
		'System Address Line 3' 		as sys_addr_line3,
		'System Address City' 			as sys_city,
		'System Address State' 			as sys_state,
		'System Address Zip' 			as sys_zip,
		'CAD ID Code'					as sys_cad_id_code,
		'System Phone Number 1'			as sys_phone_num,
		'System Phone Number 2'			as sys_phone_num2,
		'System Fax Number'				as sys_fax_num,
		'Chief Appraiser'				as sys_chief_appraiser,
		'County Name'					as sys_county_name,
		'Office Name'					as sys_office_name,
		'Web URL Address' 				as sys_url,
		*/
		'Case ID'						as case_id,
		'Protest By ID'					as prot_by_id,
		'Protester Address (4 Lines)'	as addr_main,
		'Protester Name'				as file_as_name,
		'Protester Name and Address'	as name_address,
		'Protester Name and Address (5 Lines)'	as name_address,
		'Protester Name and Address (6 Lines - Intl)'	as name_address_6lines,
		'Protester Address Line 1'		as addr_line1,
		'Protester Address Line 2'		as addr_line2,
		'Protester Address Line 3'		as addr_line3,
		'Protester Street Address'		as addr_main,
		'Protester Address City'		as addr_city,
		'Protester Address State'		as addr_state,
		'Protester Address Zip'			as addr_zip,
		'Protester Address Country Code'	as addr_country_cd,
		'Protester Address Country Name'	as addr_country_name,
		'Protester Address Short Zip'	as zip,
		'Protester Address Cass'		as cass,
		'Protester Address Route'		as route,
		'Protester Address Zip Barcode'	as ZIP_BARCODE
END

GO

