

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

CREATE PROCEDURE ODP

	@case_id int,
	@ID1 int,
	@ID2 int = NULL
as

IF @case_id > 0
BEGIN
	/*	Why did the original designer put this stuff in here?  There's a stored procedure
		(LetterMergeSystemAddress) and a whole set of code already in place to include 
		system address tags in word merge letters!
		Oh well...gotta keep it I guess for backwards compatibility. 
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
	declare @url 			varchar (50) 

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
		@url 			= url
	FROM 
		system_address	WITH (NOLOCK)
	WHERE 
		system_type in ('A', 'B')

	DECLARE @prop_val_yr int
	DECLARE @prot_by_id int
	declare @prop_id int
	declare @exempt_cd varchar(10)
	declare @exemptions varchar(200)



	if @ID2 IS NULL 
	begin
		set @prop_val_yr = @ID1
		-- Since the prot_by_id is REQUIRED, this code should never be reached, but just in case, 
		-- we need to grab a prot_by_id
		SELECT
			@prot_by_id = appba.prot_by_id,
			@prop_id = ap.prop_id
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
		set @prot_by_id = @ID1

		SELECT
			@prop_id = ap.prop_id
		FROM 
			_arb_protest as ap	WITH (NOLOCK)
		WHERE 
					ap.case_id = @case_id
			AND		ap.prop_val_yr = @prop_val_yr
	end

	set @exemptions = ''


	-- get the protest by address information
	declare @file_as_name		varchar (70)
	declare @addr_line_1		varchar	(60)
	declare @addr_line_2		varchar	(60)
	declare @addr_line_3		varchar	(60)
	declare @addr_city		varchar	(50)
	declare @addr_state		varchar	(50)
	declare @addr_zip		varchar	(14)
	declare @addr_country_cd	char	(5)
	declare @addr_country_name	varchar	(60)
	declare	@addr_is_international 	bit
	declare @addr_short_zip		varchar (5)
	declare @addr_cass		varchar (4)
	declare @addr_route		varchar (2)
	declare @addr_barcode		varchar (14)		

	declare @full_addr		varchar	(400)

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
			a.acct_id = @prot_by_id

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

	-- get primary_protest_by address information
	declare @primary_prot_by_id		int
	declare @primary_file_as_name		varchar (70)
	declare @primary_addr_line_1		varchar	(60)
	declare @primary_addr_line_2		varchar	(60)
	declare @primary_addr_line_3		varchar	(60)
	declare @primary_addr_city		varchar	(50)
	declare @primary_addr_state		varchar	(50)
	declare @primary_addr_zip		varchar	(14)
	declare @primary_addr_country_cd	char	(5)
	declare @primary_addr_country_name	varchar	(60)
	declare	@primary_addr_is_international 	bit
	declare @primary_addr_short_zip		varchar (5)
	declare @primary_addr_cass		varchar (4)
	declare @primary_addr_route		varchar (2)
	declare @primary_addr_barcode		varchar (14)		

	SELECT
		@primary_prot_by_id = appba.prot_by_id
	FROM				
		_arb_protest as ap WITH (NOLOCK)
	INNER JOIN			
		_arb_protest_protest_by_assoc as appba WITH (NOLOCK) 
	ON		
			appba.case_id = ap.case_id
		AND	appba.prop_val_yr = ap.prop_val_yr
		AND	appba.primary_protester = 1
	WHERE
			ap.case_id = @case_id
		AND	ap.prop_val_yr = @prop_val_yr

	SELECT 
		@primary_file_as_name		= rtrim(isnull(a.confidential_file_as_name, a.file_as_name)),
		@primary_addr_line_1		= rtrim(isnull(ad.addr_line1, '')),
		@primary_addr_line_2		= rtrim(isnull(ad.addr_line2, '')),
		@primary_addr_line_3		= rtrim(isnull(ad.addr_line3, '')),
		@primary_addr_city		= rtrim(isnull(ad.addr_city, '')),
		@primary_addr_state		= rtrim(isnull(ad.addr_state, '')),
		@primary_addr_zip		= rtrim(isnull(ad.addr_zip, '')),
		@primary_addr_country_cd	= rtrim(isnull(ad.country_cd, '')),
		@primary_addr_country_name	= rtrim(isnull(country.country_name, '')),
		@primary_addr_is_international	= isnull(ad.is_international, 0),
		@primary_addr_short_zip		= ad.zip,
		@primary_addr_cass		= ad.cass,
		@primary_addr_route		= ad.route,
		@primary_addr_barcode		= ad.zip_4_2
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
			a.acct_id = @primary_prot_by_id


	-- get the property owner address information
	declare @owner_file_as_name		varchar (70)
	declare @owner_addr_line_1		varchar	(60)
	declare @owner_addr_line_2		varchar	(60)
	declare @owner_addr_line_3		varchar	(60)
	declare @owner_addr_city		varchar	(50)
	declare @owner_addr_state		varchar	(50)
	declare @owner_addr_zip		varchar	(14)
	declare @owner_addr_country_cd	char	(5)
	declare @owner_addr_country_name	varchar	(60)
	declare	@owner_addr_is_international 	bit
	declare @owner_addr_short_zip		varchar (5)
	declare @owner_addr_cass		varchar (4)
	declare @owner_addr_route		varchar (2)
	declare @owner_addr_barcode		varchar (14)		

	SELECT 
		@owner_file_as_name		= rtrim(isnull(a.confidential_file_as_name, a.file_as_name)),
		@owner_addr_line_1		= rtrim(isnull(ad.addr_line1, '')),
		@owner_addr_line_2		= rtrim(isnull(ad.addr_line2, '')),
		@owner_addr_line_3		= rtrim(isnull(ad.addr_line3, '')),
		@owner_addr_city		= rtrim(isnull(ad.addr_city, '')),
		@owner_addr_state		= rtrim(isnull(ad.addr_state, '')),
		@owner_addr_zip			= rtrim(isnull(ad.addr_zip, '')),
		@owner_addr_country_cd		= rtrim(isnull(ad.country_cd, '')),
		@owner_addr_country_name	= rtrim(isnull(country.country_name, '')),
		@owner_addr_is_international	= isnull(ad.is_international, 0),
		@owner_addr_short_zip		= ad.zip,
		@owner_addr_cass		= ad.cass,
		@owner_addr_route		= ad.route,
		@owner_addr_barcode		= ad.zip_4_2
	FROM
		prop_supp_assoc	AS psa WITH (nolock)
	INNER JOIN
		owner AS o WITH (nolock)
	ON
			o.prop_id = psa.prop_id
		AND	o.owner_tax_yr = psa.owner_tax_yr
		AND	o.sup_num = psa.sup_num
	INNER JOIN
		account	AS a WITH (nolock)
	ON
		a.acct_id = o.owner_id
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
			psa.prop_id = @prop_id
		AND	psa.owner_tax_yr = @prop_val_yr


	-- Build a list of exemptions for the property 
	declare EXEMPTIONS CURSOR FAST_FORWARD
	FOR	SELECT RTRIM(pe.exmpt_type_cd)
		FROM property_exemption as pe
		WITH (NOLOCK)

		INNER JOIN prop_supp_assoc as psa
		WITH (NOLOCK)
		ON pe.prop_id = psa.prop_id
		AND pe.exmpt_tax_yr = psa.owner_tax_yr
		AND pe.sup_num = psa.sup_num

		WHERE pe.prop_id = @prop_id
		AND pe.exmpt_tax_yr = @prop_val_yr

		ORDER BY pe.exmpt_type_cd

	OPEN EXEMPTIONS

	FETCH NEXT FROM EXEMPTIONS INTO @exempt_cd

	WHILE @@FETCH_STATUS = 0
	BEGIN
		IF @exemptions <> ''
		BEGIN
			SET @exemptions = @exemptions + ', '
		END

		SET @exemptions = @exemptions + @exempt_cd

		FETCH NEXT FROM EXEMPTIONS INTO @exempt_cd
	END

	CLOSE EXEMPTIONS
	DEALLOCATE EXEMPTIONS

	-- Select all the values for the recordset to be returned
	-- I know there are multiple duplicates of the same data, but what 
	-- can I do?  I have to maintain backward compatibility...
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
		@prop_id		as prop_id,
		@case_id		as case_id,
		@prot_by_id		as prot_by_id,
		@prop_val_yr		as prop_val_yr,
		@exemptions 		as exemptions,

		-- protest by address info
		@full_addr		as prot_by_addr_main,
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
		)					as prot_by_name_address,
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
		)					as prot_by_name_address_5lines,
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
		)					as prot_by_name_address_6lines,
		@addr_line_1		as addr_line1,
		@addr_line_2		as addr_line2,
		@addr_line_3		as addr_line3,
		@addr_city			as addr_city,
		@addr_state			as addr_state,
		@addr_zip			as addr_zip,
		@addr_country_cd	as addr_country_cd,
		@addr_country_name	as addr_country_name,
		@addr_is_international	as addr_is_international,
		@addr_city			as prot_by_addr_city,
		@addr_state			as prot_by_addr_state,
		@addr_zip			as prot_by_addr_zip,
		@addr_short_zip		as zip,
		@addr_cass			as cass,
		@addr_route			as route,
		@addr_barcode		as ZIP_BARCODE,
		-- primary protest by address info
		@primary_prot_by_id			as primary_prot_by_id,
		@primary_file_as_name		as primary_file_as_name,
		dbo.fn_Address(
			@primary_file_as_name, 
			@primary_addr_line_1,
			@primary_addr_line_2,
			@primary_addr_line_3,
			@primary_addr_city,
			@primary_addr_state,
			@primary_addr_zip,
			@primary_addr_country_name,
			@primary_addr_is_international,
			5
		)							as primary_name_address,
		dbo.fn_Address(
			@primary_file_as_name, 
			@primary_addr_line_1,
			@primary_addr_line_2,
			@primary_addr_line_3,
			@primary_addr_city,
			@primary_addr_state,
			@primary_addr_zip,
			@primary_addr_country_name,
			@primary_addr_is_international,
			5
		)							as primary_name_address_5lines,
		dbo.fn_Address(
			@primary_file_as_name, 
			@primary_addr_line_1,
			@primary_addr_line_2,
			@primary_addr_line_3,
			@primary_addr_city,
			@primary_addr_state,
			@primary_addr_zip,
			@primary_addr_country_name,
			@primary_addr_is_international,
			6
		)							as primary_name_address_6lines,
		@primary_addr_line_1		as primary_addr_line1,
		@primary_addr_line_2		as primary_addr_line2,
		@primary_addr_line_3		as primary_addr_line3,
		@primary_addr_city			as primary_addr_city,
		@primary_addr_state			as primary_addr_state,
		@primary_addr_zip			as primary_addr_zip,
		@primary_addr_country_cd	as primary_addr_country_cd,
		@primary_addr_country_name	as primary_addr_country_name,
		@primary_addr_is_international	as primary_addr_is_international,
		@primary_addr_short_zip		as primary_zip,
		@primary_addr_cass			as primary_cass,
		@primary_addr_route			as primary_route,
		@primary_addr_barcode		as primary_ZIP_BARCODE,
		-- property owner address info		
		@owner_file_as_name			as owner_name,		
		dbo.fn_Address(
			@owner_file_as_name, 
			@owner_addr_line_1,
			@owner_addr_line_2,
			@owner_addr_line_3,
			@owner_addr_city,
			@owner_addr_state,
			@owner_addr_zip,
			@owner_addr_country_name,
			@owner_addr_is_international,
			5
		)							as owner_name_address,
		dbo.fn_Address(
			@owner_file_as_name, 
			@owner_addr_line_1,
			@owner_addr_line_2,
			@owner_addr_line_3,
			@owner_addr_city,
			@owner_addr_state,
			@owner_addr_zip,
			@owner_addr_country_name,
			@owner_addr_is_international,
			5
		)							as owner_name_address_5lines,
		dbo.fn_Address(
			@owner_file_as_name, 
			@owner_addr_line_1,
			@owner_addr_line_2,
			@owner_addr_line_3,
			@owner_addr_city,
			@owner_addr_state,
			@owner_addr_zip,
			@owner_addr_country_name,
			@owner_addr_is_international,
			6
		)							as owner_name_address_6lines,
		@owner_addr_line_1			as owner_addr_line1,
		@owner_addr_line_2			as owner_addr_line2,
		@owner_addr_line_3			as owner_addr_line3,
		@owner_addr_city			as owner_addr_city,
		@owner_addr_state			as owner_addr_state,
		@owner_addr_zip				as owner_addr_zip,
		@owner_addr_country_cd		as owner_addr_country_cd,
		@owner_addr_country_name	as owner_addr_country_name,
		@owner_addr_is_international	as owner_addr_is_international,
		@owner_addr_short_zip		as owner_zip,
		@owner_addr_cass			as owner_cass,
		@owner_addr_route			as owner_route,
		@owner_addr_barcode			as owner_ZIP_BARCODE,

		p.geo_id,
		p.ref_id1,
		p.ref_id2,
		pv.legal_desc,
		ISNULL(pv.ag_use_val,0) + ISNULL(pv.timber_use,0) 	as ag_value,
		pv.land_hstd_val 									as land_hstd_val,
		ISNULL(pv.ag_market,0) + ISNULL(pv.land_hstd_val,0)+ ISNULL(pv.land_non_hstd_val,0) as land_mkt_val,
		ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0) as imprv_val,
		pv.market 											as market_val,		
		pv.assessed_val 									as current_assessed,

		datename(month, docket.docket_start_date_time) + ' ' 
			+ datename(day, docket.docket_start_date_time) + ', ' 
			+ datename(year, docket.docket_start_date_time)  		as docket_date,
		convert(varchar(10),docket.docket_start_date_time, 108) 	as docket_begin,
		convert(varchar(10),docket.docket_end_date_time, 108)  		as docket_end,

		ap.prot_type,

		CASE p.prop_type_cd
			WHEN 'P' THEN 'PERSONAL PROPERTY VALUE:'
			WHEN 'MN' THEN 'MINERAL PROPERTY VALUE:'
			ELSE 'EXEMPTIONS:'
		END 											as label1,
		CASE p.prop_type_cd
			WHEN 'P' THEN CONVERT(varchar(20), ISNULL(pv.assessed_val,0))
			WHEN 'MN' THEN CONVERT(varchar(20), ISNULL(pv.assessed_val,0))
			ELSE @exemptions
		END 											as value1,
		CASE p.prop_type_cd
			WHEN 'P' THEN ''
			WHEN 'MN' THEN ''
			ELSE 'LAND AG/TIM VALUE:'
		END 											as label2,
		CASE p.prop_type_cd
			WHEN 'P' THEN ''
			WHEN 'MN' THEN ''
			ELSE LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.ag_use_val,0) 
				+ ISNULL(pv.timber_use,0)),1), CHARINDEX('.', CONVERT(varchar(20), 
				CONVERT(money, ISNULL(pv.ag_use_val,0) 
				+ ISNULL(pv.timber_use,0)), 1), 1) - 1)
		END 											as value2,
		CASE p.prop_type_cd
			WHEN 'P' THEN ''
			WHEN 'MN' THEN ''
			ELSE 'LAND HOMESTEAD VALUE:'
		END 											as label3,
		CASE p.prop_type_cd
			WHEN 'P' THEN ''
			WHEN 'MN' THEN ''
			ELSE LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.land_hstd_val,0)),1), 
				CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, 
				ISNULL(pv.land_hstd_val,0)), 1), 1) - 1)
		END 											as value3,
		CASE p.prop_type_cd
			WHEN 'P' THEN ''
			WHEN 'MN' THEN ''
			ELSE 'LAND NON HOMESITE:'
		END 											as label4,
		CASE p.prop_type_cd
			WHEN 'P' THEN ''
			WHEN 'MN' THEN ''
			ELSE LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.land_non_hstd_val,0) 
				+ ISNULL(pv.ag_market,0) + ISNULL(pv.timber_market,0)),1), 
				CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, 
				ISNULL(pv.land_non_hstd_val,0) + ISNULL(pv.ag_market,0) 
				+ ISNULL(pv.timber_market,0)), 1), 1) - 1)
		END 											as value4,
		CASE p.prop_type_cd
			WHEN 'P' THEN ''
			WHEN 'MN' THEN ''
			ELSE 'IMPROVEMENT VALUE:'
		END 											as label5,
		CASE p.prop_type_cd
			WHEN 'P' THEN ''
			WHEN 'MN' THEN ''
			ELSE LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0) 
				+ ISNULL(pv.imprv_non_hstd_val,0)),1), CHARINDEX('.', 
				CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0) 
				+ ISNULL(pv.imprv_non_hstd_val,0)), 1), 1) - 1)
		END 											as value5,
		CASE p.prop_type_cd
			WHEN 'P' THEN ''
			WHEN 'MN' THEN ''
			ELSE 'TOTAL MARKET VALUE:'
		END 											as label6,
		CASE p.prop_type_cd
			WHEN 'P' THEN ''
			WHEN 'MN' THEN ''
			ELSE LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.market,0)),1), 
				CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, 
				ISNULL(pv.market,0)), 1), 1) - 1)
		END 											as value6,
		CASE p.prop_type_cd
			WHEN 'P' THEN 'TOTAL PERSONAL PROPERTY:'
			WHEN 'MN' THEN 'TOTAL MINERAL PROPERTY:'
			ELSE 'TOTAL NEW ASSESSED VALUE:'
		END 											as label7,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.assessed_val,0)),1), 
			CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, 
			ISNULL(pv.assessed_val,0)), 1), 1) - 1) 					as value7, 
		CASE p.prop_type_cd
			WHEN 'P' THEN ''
			WHEN 'MN' THEN ''
			ELSE 'IMPROVEMENT HOMESTEAD VALUE:'
		END 											as label8,
		CASE p.prop_type_cd
			WHEN 'P' THEN ''
			WHEN 'MN' THEN ''
			ELSE LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0)),1), 
				CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, 
				ISNULL(pv.imprv_hstd_val,0)), 1), 1) - 1)
		END 											as value8,
		CASE p.prop_type_cd
			WHEN 'P' THEN ''
			WHEN 'MN' THEN ''
			ELSE 'IMPROVEMENT NON-HOMESTEAD VALUE:'
		END 											as label9,
		CASE p.prop_type_cd
			WHEN 'P' THEN ''
			WHEN 'MN' THEN ''
			ELSE LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_non_hstd_val,0)),1), 
				CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, 
				ISNULL(pv.imprv_non_hstd_val,0)), 1), 1) - 1)
			END 										as value9

	FROM 		
		_arb_protest as ap WITH (NOLOCK)
	INNER JOIN 
		property as p WITH (NOLOCK)
	ON 
		ap.prop_id = p.prop_id
	INNER JOIN 
		prop_supp_assoc as psa WITH (NOLOCK)
	ON 
			ap.prop_id = psa.prop_id
		AND 	ap.prop_val_yr = psa.owner_tax_yr

	INNER JOIN 
		property_val as pv WITH (NOLOCK)
	ON 
			psa.prop_id = pv.prop_id
		AND 	psa.sup_num = pv.sup_num
		AND 	psa.owner_tax_yr = pv.prop_val_yr

	LEFT OUTER JOIN 
		_arb_protest_hearing_docket as docket WITH (NOLOCK)
	ON 
		ap.docket_id = docket.docket_id

	WHERE 
			ap.case_id = @case_id
		AND 	ap.prop_val_yr = @prop_val_yr
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
		'CAD ID Code'				as sys_cad_id_code,
		'System Phone Number 1'			as sys_phone_num,
		'System Phone Number 2'			as sys_phone_num2,
		'System Fax Number'			as sys_fax_num,
		'Chief Appraiser'			as sys_chief_appraiser,
		'County Name'				as sys_county_name,
		'Office Name'				as sys_office_name,
		'Web URL Address' 			as sys_url,
		*/
		'Property ID'		as prop_id,
		'Case ID'		as case_id,
		'Exemptions List'	as exemptions,
		'Appraisal Year'	as prop_val_yr,

		-- protest by address info
		'Protest By ID'				as prot_by_id,
		'Protester Street Address'			as prot_by_addr_main,
		'Protester Name'			as file_as_name,		
		'Protester Name and Address'		as prot_by_name_address,
		'Protester Name and Address (5 Lines)'	as prot_by_name_address,
		'Protester Name and Address (6 Lines - Intl)'	as prot_by_name_address_6lines,
		'Protester Address Line 1'			as addr_line1,
		'Protester Address Line 2'			as addr_line2,
		'Protester Address Line 3'			as addr_line3,
		'Protester Address City'			as addr_city,
		'Protester Address State'			as addr_state,
		'Protester Address Zip'				as addr_zip,
		'Protester Address Country Code'	as addr_country_cd,
		'Protester Address Country Name'	as addr_country_name,
		'Protester Zip'						as zip,
		'Protester Cass'					as cass,
		'Protester Route'					as route,
		'Protester Zip Barcode'				as ZIP_BARCODE,
		-- primary protest by address info
		'Primary Protest By ID'				as primary_prot_by_id,
		'Primary Protester Name'			as primary_file_as_name,
		'Primary Protester Name and Address' as primary_name_address,
		'Primary Protester Name and Address (5 Lines)'	as primary_name_address,
		'Primary Protester Name and Address (6 Lines - Intl)' as primary_name_address_6lines,
		'Primary Protester Address Line 1'	as primary_addr_line1,
		'Primary Protester Address Line 2'	as primary_addr_line2,
		'Primary Protester Address Line 3'	as primary_addr_line3,
		'Primary Protester Address City'	as primary_addr_city,
		'Primary Protester Address State'	as primary_addr_state,
		'Primary Protester Address Zip'		as primary_addr_zip,
		'Primary Protester Address Country Code' as primary_addr_country_cd,
		'Primary Protester Address Country Name' as primary_addr_country_name,
		'Primary Protester Zip'				as primary_zip,
		'Primary Protester Cass'			as primary_cass,
		'Primary Protester Route'			as primary_route,
		'Primary Protester Zip Barcode'		as primary_ZIP_BARCODE,
		-- property owner address info		
		'Owner Name'						as owner_name,		
		'Owner Name and Address'			as owner_name_address,
		'Owner Name and Address (5 Lines)'	as owner_name_address,
		'Owner Name and Address (6 Lines - Intl)' as owner_name_address_6lines,
		'Owner Address Line 1'				as owner_addr_line1,
		'Owner Address Line 2'				as owner_addr_line2,
		'Owner Address Line 3'				as owner_addr_line3,
		'Owner Address City'				as owner_addr_city,
		'Owner Address State'				as owner_addr_state,
		'Owner Address Zip'					as owner_addr_zip,
		'Owner Address Country Code'		as owner_addr_country_cd,
		'Owner Address Country Name'		as owner_addr_country_name,
		'Owner Zip'							as owner_zip,
		'Owner Cass'						as owner_cass,
		'Owner Route'						as owner_route,
		'Owner Zip Barcode'					as owner_ZIP_BARCODE,

		'Property Geo ID'					as geo_id,
		'Property Ref ID 1'					as ref_id1,
		'Property Ref ID 2'					as ref_id2,
		'Property Legal Description'		as legal_desc,
		'Property Ag Value'					as ag_value,
		'Property Land Homestead Value'		as land_hstd_val,
		'Property Land Market Value'		as land_mkt_val,
		'Property Imprv Value'				as imprv_val,
		'Property Market Value'				as market_val,
		'Property Current Assessed Value'	as current_assessed,

		'Docket Date'			as docket_date,
		'Docket Start Time'		as docket_begin,
		'Docket End Time'		as docket_end,

		'Protest Type'			as prot_type,
		'Label 1'				as label1,
		'Value 1'				as value1,
		'Label 2'				as label2,
		'Value 2'				as value2,
		'Label 3'				as label3,
		'Value 3'				as value3,
		'Label 4'				as label4,
		'Value 4'				as value4,
		'Label 5'				as label5,
		'Value 5'				as value5,
		'Label 6'				as label6,
		'Value 6'				as value6,
		'Label 7'				as label7,
		'Value 7'				as value7,
		'Label 8'				as label8,
		'Value 8'				as value8,
		'Label 9'				as label9,
		'Value 9'				as value9
END

GO

