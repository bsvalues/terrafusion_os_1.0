

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

CREATE PROCEDURE AP

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
	declare @tax_year 			numeric(4,0)

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
		
	select
		@tax_year = appr_yr + 1 
	from 
		pacs_system with (nolock)

	DECLARE @prop_val_yr int
	DECLARE @prot_by_id int
	declare @prop_id int
	declare @entity_cd varchar(10)
	declare @entities varchar(200)
	declare @exempt_cd varchar(10)
	declare @exemptions varchar(200)
	declare @bedrooms varchar(20)
	declare @bathrooms varchar(20)
	declare @fireplaces varchar (20)
	declare @num_units varchar(20)

	if @ID2 IS NULL 
	begin
		set @prop_val_yr = @ID1
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
	declare	@owner_home_phone		varchar (20)
	declare	@owner_business_phone		varchar (20)

	declare @owner_full_addr		varchar	(400)

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
		@owner_addr_barcode		= ad.zip_4_2,
		@owner_home_phone		= ph.phone_num,
		@owner_business_phone		= pb.phone_num
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

	LEFT OUTER JOIN 
		phone as ph WITH (NOLOCK)
	ON 
			a.acct_id = ph.acct_id
		AND 	ph.phone_type_cd = 'H'

	LEFT OUTER JOIN 
		phone as pb WITH (NOLOCK)
	ON 
			a.acct_id = pb.acct_id
		AND 	pb.phone_type_cd = 'B'

	WHERE 
			psa.prop_id = @prop_id
		AND	psa.owner_tax_yr = @prop_val_yr


	-- create a full address with carriage returns
	set @owner_full_addr = ''

	if @owner_addr_line_1 <> ''
	begin
		set @owner_full_addr = @owner_full_addr + @owner_addr_line_1 + CHAR(13)
	end

	if @owner_addr_line_2 <> ''
	begin
		set @owner_full_addr = @owner_full_addr + @owner_addr_line_2 + CHAR(13)
	end

	if @owner_addr_line_3 <> ''
	begin
		set @owner_full_addr = @owner_full_addr + @owner_addr_line_3 + CHAR(13)
	end

	if @owner_addr_city <> '' or @owner_addr_state <> '' or @owner_addr_zip <> ''
	begin
		set @owner_full_addr = @owner_full_addr + CHAR(13)
	end
	
	if @owner_addr_city <> '' 
	begin
		set @owner_full_addr = @owner_full_addr + @owner_addr_city

		if @owner_addr_state <> ''
		begin
			set @owner_full_addr = @owner_full_addr + ', ' + @owner_addr_state
		end
	end
	else
	begin
		if @owner_addr_state <> ''
		begin
			set @owner_full_addr = @owner_full_addr + @owner_addr_state
		end
	end

	if @owner_addr_zip <> ''
	begin
		set @owner_full_addr = @owner_full_addr + ' ' + @owner_addr_zip
	end

	-- Get a list of entities for the property
	set @entities = ''

	declare ENTITIES CURSOR FAST_FORWARD
	FOR	SELECT RTRIM(entity_cd)
		FROM entity_prop_assoc as epa
		WITH (NOLOCK)

		INNER JOIN prop_supp_assoc as psa
		WITH (NOLOCK)
		ON epa.prop_id = psa.prop_id
		AND epa.tax_yr = psa.owner_tax_yr
		AND epa.sup_num = psa.sup_num

		INNER JOIN entity as e
		WITH (NOLOCK)
		ON epa.entity_id = e.entity_id

		WHERE epa.prop_id = @prop_id
		AND epa.tax_yr = @prop_val_yr

		ORDER BY e.entity_cd

	OPEN ENTITIES

	FETCH NEXT FROM ENTITIES INTO @entity_cd

	WHILE @@FETCH_STATUS = 0
	BEGIN
		IF @entities <> ''
		BEGIN
			SET @entities = @entities + ', '
		END
		SET @entities = @entities + @entity_cd

		FETCH NEXT FROM ENTITIES INTO @entity_cd
	END

	CLOSE ENTITIES
	DEALLOCATE ENTITIES


	-- Get a list of exemptions for the property
	set @exemptions = ''

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

	
	-- Get a count of the number of bedrooms
	set @bedrooms = ''

	select
		@bedrooms = cast(sum(isnull(ia.i_attr_unit, 0.00)) as varchar(20))
	from
		imprv_attr as ia with (nolock)
	inner join
		prop_supp_assoc as psa with (nolock)
	on
		ia.prop_id = psa.prop_id
	and	ia.prop_val_yr = psa.owner_tax_yr
	and	ia.sup_num = psa.sup_num
	where
		ia.prop_id = @prop_id
	and	ia.prop_val_yr = @prop_val_yr
	and	ia.sale_id = 0
	and	ia.i_attr_val_id = 15
		

	-- Get a count of the number of bathrooms
	set @bathrooms = ''

	select
		@bathrooms = cast(sum(isnull(ia.i_attr_unit, 0.00)) as varchar(20))
	from
		imprv_attr as ia with (nolock)
	inner join
		prop_supp_assoc as psa with (nolock)
	on
		ia.prop_id = psa.prop_id
	and	ia.prop_val_yr = psa.owner_tax_yr
	and	ia.sup_num = psa.sup_num
	where
		ia.prop_id = @prop_id
	and	ia.prop_val_yr = @prop_val_yr
	and	ia.sale_id = 0
	and	ia.i_attr_val_id = 8
		

	-- Get a count of the number of fireplaces
	set @fireplaces = ''

	select
		@fireplaces = cast(sum(isnull(ia.i_attr_unit, 0.00)) as varchar(20))
	from
		imprv_attr as ia with (nolock)
	inner join
		prop_supp_assoc as psa with (nolock)
	on
		ia.prop_id = psa.prop_id
	and	ia.prop_val_yr = psa.owner_tax_yr
	and	ia.sup_num = psa.sup_num
	where
		ia.prop_id = @prop_id
	and	ia.prop_val_yr = @prop_val_yr
	and	ia.sale_id = 0
	and	ia.i_attr_val_id = 10
		

	-- Get the total number of improvements
	set @num_units = ''

	select
		@num_units = cast(sum(isnull(num_imprv, 0)) as varchar(20))
	from
		imprv with (nolock)
	inner join
		prop_supp_assoc as psa with (nolock)
	on
		imprv.prop_id = psa.prop_id
	and	imprv.prop_val_yr = psa.owner_tax_yr
	and	imprv.sup_num = psa.sup_num
	where
		imprv.prop_id = @prop_id
	and	imprv.prop_val_yr = @prop_val_yr
	and	imprv.sale_id = 0


	-- Select all the values for the recordset to be returned
	SELECT TOP 1
		@sys_addr_line1 			as sys_addr_line1,
		@sys_addr_line2 			as sys_addr_line2,
		@sys_addr_line3 			as sys_addr_line3,
		@sys_addr_city 				as sys_city,
		@sys_addr_state 			as sys_state,
		@sys_addr_zip 				as sys_zip,
		@cad_id_code				as sys_cad_id_code,
		@sys_phone_num 				as sys_phone_num,
		@sys_phone_num2				as sys_phone_num2,
		@sys_fax_num				as sys_fax_num,
		@chief_appraiser			as sys_chief_appraiser,
		@county_name				as sys_county_name,
		@office_name				as sys_office_name,
		@url 						as sys_url,

		@prop_id					as prop_id,
		@case_id					as case_id,
		@prot_by_id					as prot_by_id,
		@prop_val_yr				as prop_val_yr,
		
		-- protest by address info		
		@full_addr					as file_as_addr_format,
		@file_as_name				as file_as_name,		
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
		) 							as prot_by_name_address,
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
		) 							as prot_by_name_address_5lines,
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
		) 											as prot_by_name_address_6lines,
		@addr_line_1				as addr_line1,
		@addr_line_2				as addr_line2,
		@addr_line_3				as addr_line3,
		@addr_city					as addr_city,
		@addr_state					as addr_state,
		@addr_zip					as addr_zip,
		@addr_country_cd			as addr_country_cd,
		@addr_country_name			as addr_country_name,
		@addr_is_international		as addr_is_international,
		@addr_short_zip				as zip,
		@addr_cass					as cass,
		@addr_route					as route,
		@addr_barcode				as ZIP_BARCODE,
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
		) 							as primary_name_address,
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
		) 							as primary_name_address_5lines,
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
		) 							as primary_name_address_6lines,
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
		@owner_full_addr			as owner_addr_format,
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
		) 							as owner_name_address,
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
		) 							as owner_name_address_5lines,
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
		) 							as owner_name_address_6lines,
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
		@owner_home_phone			as owner_home_phone,
		@owner_business_phone		as owner_business_phone,

		@exemptions 				as exemptions,
	
		@bedrooms 					as bedrooms,
		@bathrooms 					as bathrooms,
		@fireplaces 				as fireplaces,
		@num_units 					as number_of_units,

		p.geo_id,
		p.ref_id1,
		p.ref_id2,
		p.dba_name,

		appraiser.appraiser_nm,
		appraiser.appraiser_full_name,

		convert(varchar(10), prot_create_dt, 101) as create_dt,
		CONVERT(CHAR(11),ap.appraiser_meeting_date_time,101) + SUBSTRING(CONVERT(CHAR(19),ap.appraiser_meeting_date_time,100),13,19)  as appraiser_meeting_date_time,
		CONVERT(CHAR(11),ap.appraiser_meeting_date_time,101)   as appraiser_meeting_date,
        	SUBSTRING(CONVERT(CHAR(19),ap.appraiser_meeting_date_time,100),13,19) as appraiser_meeting_time,
		ap.prot_taxpayer_comments,
		ap.prot_type,
		ap.prot_affidavit_testimony_received as at_method,
		ap.prot_affidavit_testimony_by as at_from,

		appraiser1.appraiser_nm as staff_appraiser,
		appraiser1.appraiser_full_name as staff_appraiser_full_name,

		pp.condition_cd as condition_code,
		pp.heat_ac_code as heat_ac_code,
		pp.property_use_cd as property_use_code,
		case
			when
				isnull(pp.land_sqft, 0) > 0
			then
				cast(pp.land_sqft as varchar(50)) + ' Sq. Ft.'
			when
				isnull(pp.land_acres, 0) > 0
			then
				cast(pp.land_acres as varchar(50)) + ' Acres'
			when
				isnull(pp.land_front_feet, 0) > 0
			then
				cast(pp.land_front_feet as varchar(50)) + ' Front Feet'
			when
				isnull(pp.land_lot, 'F') = 'T'
			then
				'LOT'
			else
				cast(0 as varchar(50))
		end as land_size,
		case
			when
				isnull(pp.yr_blt, 0) > 0
			then
				cast((datepart(yyyy, GetDate()) - cast(pp.yr_blt as int)) as varchar(5)) + ' Years'
			else
				''
		end as actual_age,

		pv.legal_desc,
		LEFT(pv.legal_desc, 40) as legal_desc_40,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.ag_use_val,0) + ISNULL(pv.timber_use,0)),1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.ag_use_val,0) + ISNULL(pv.timber_use,0)), 1), 1) - 1) as ag_value,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.land_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.land_hstd_val), 1), 1) - 1) as land_hstd_val,
    	LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.ag_market,0) + ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.ag_market,0) + ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)), 1), 1) - 1) as land_mkt_val,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), 1) - 1) as imprv_val,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.market), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.market), 1), 1) - 1) as market_val,
		CASE WHEN ISNULL(pv.ag_use_val,0) + ISNULL(pv.ag_market,0) = 0
			THEN 'N'
			ELSE 'Y'
		END as ag_flag,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.imprv_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.imprv_hstd_val), 1), 1) - 1) as current_imprv_hstd_val,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.imprv_non_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.imprv_non_hstd_val), 1), 1) - 1) as current_imprv_non_hstd_val,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), 1) - 1) as current_imprv_val,

		convert(varchar(10),docket.docket_start_date_time, 101)  as docket_date,
		ltrim(right(convert(varchar(20), docket_start_date_time, 100),7)) as docket_begin,
		ltrim(right(convert(varchar(20), docket_end_date_time, 100),7)) as docket_end,
		
		LTRIM(ISNULL(s.situs_num, '') + ' ' + LTRIM(ISNULL(s.situs_street_prefx,'') + ' ' 
			+ LTRIM(ISNULL(s.situs_street,'') + ' ' + ISNULL(s.situs_street_sufix,''))) + ' ' 
			+ ISNULL(s.situs_city,'') + ', ' + ISNULL(s.situs_state,'') + ' ' 
			+ ISNULL(s.situs_zip,'')) as situs,
		
		convert(varchar(20), convert(money, case
			when
				cast(isnull(pp.living_area, 0) as numeric(14,2)) > 0
			then (
				cast(isnull(pv.imprv_hstd_val, 0) + isnull(pv.imprv_non_hstd_val, 0) as numeric(14,2)) /
				cast(pp.living_area as numeric(14,2))
			)
			else
				cast(isnull(pv.imprv_hstd_val, 0) + isnull(pv.imprv_non_hstd_val, 0) as numeric(14,2))
		end, 1)) as current_imprv_val_per_sqft,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.land_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.land_hstd_val), 1), 1) - 1) as current_land_hstd_val,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.land_non_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.land_non_hstd_val), 1), 1) - 1) as current_land_non_std_val,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)), 1), 1) - 1) as current_land_val,
		convert(varchar(20), convert(money, case
			when
				cast(isnull(pp.land_sqft, 0) as numeric(18,2)) > 0
			then (
				cast(isnull(pv.land_hstd_val, 0) + isnull(pv.land_non_hstd_val, 0) as numeric(18,2)) /
				cast(pp.land_sqft as numeric(18,2))
			)
			else
				cast(isnull(pv.land_hstd_val, 0) + isnull(pv.land_non_hstd_val, 0) as numeric(18,2))
		end, 1)) as current_land_val_per_sqft,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0) + ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0) + ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)), 1), 1) - 1) as current_imprv_land_val,
	
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.ag_market,0) + ISNULL(pv.timber_market,0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.ag_market,0) + ISNULL(pv.timber_market,0)), 1), 1) - 1) as Current_Ag_Timber_NonHomestead_Market_value,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.ag_use_val,0) + ISNULL(pv.timber_use,0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.ag_use_val,0) + ISNULL(pv.timber_use,0)), 1), 1) - 1) as Current_Ag_Timber_NonHomestead_Use_value,
	
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.ag_hs_mkt_val,0) + ISNULL(pv.timber_hs_mkt_val,0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.ag_hs_mkt_val,0) + ISNULL(pv.timber_hs_mkt_val,0)), 1), 1) - 1) as Current_Ag_Timber_Homestead_Market_value,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.ag_hs_use_val,0) + ISNULL(pv.timber_hs_use_val,0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.ag_hs_use_val,0) + ISNULL(pv.timber_hs_use_val,0)), 1), 1) - 1) as Current_Ag_Timber_Homestead_Use_Value,
				
		convert(varchar(10), pv.recalc_dt, 101) as current_recalc_dt,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.market), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.market), 1), 1) - 1) as current_market,
		convert(varchar(20), convert(money, case
			when
				cast(isnull(pp.living_area, 0) as numeric(14,2)) > 0
			then (
				cast(isnull(pv.market, 0) as numeric(14,2)) /
				cast(pp.living_area as numeric(14,2))
			)
			else
				cast(0 as numeric(14,2))
		end, 1)) as current_market_val_per_sqft,
	
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.rendered_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.rendered_val), 1), 1) - 1) as current_rendered,

		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(wpv.appraised_classified, 0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(wpv.appraised_classified, 0)), 1), 1) - 1) as Current_Senior_Appraised,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(wpv.appraised_non_classified, 0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(wpv.appraised_non_classified, 0)), 1), 1) - 1) as Current_NonSenior_Appraised,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(wpv.appraised_classified,0) + ISNULL(wpv.appraised_non_classified,0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(wpv.appraised_classified,0) + ISNULL(wpv.appraised_non_classified,0)), 1), 1) - 1) as Current_Total_Appraised,
	
		aaa.file_as_name as arb_agent_name,
		aaa.acct_id as arb_agent_id,

		LEFT(CONVERT(varchar(20), CONVERT(money, ap.final_land_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.final_land_hstd_val), 1), 1) - 1) as final_land_hstd_val,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.final_land_non_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.final_land_non_hstd_val), 1), 1) - 1) as final_land_non_hstd_val,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.final_imprv_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.final_imprv_hstd_val), 1), 1) - 1) as final_imprv_hstd_val,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.final_imprv_non_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.final_imprv_non_hstd_val), 1), 1) - 1) as final_imprv_non_hstd_val,	
		
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.final_ag_use_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.final_ag_use_val), 1), 1) - 1) as Final_Ag_NonHomestead_Use_Value,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.final_ag_market), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.final_ag_market), 1), 1) - 1) as Final_Ag_NonHomestead_Market_Value,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.final_timber_use), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.final_timber_use), 1), 1) - 1) as Final_Timber_NonHomestead_Use_value,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.final_timber_market), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.final_timber_market), 1), 1) - 1) as Final_Timber_NonHomestead_Market_Value,
	
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.final_ag_hs_use_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.final_ag_hs_use_val), 1), 1) - 1) as Final_Ag_Homestead_Use_Value,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.final_ag_hs_mkt_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.final_ag_hs_mkt_val), 1), 1) - 1) as Final_Ag_Homestead_Market_Value,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.final_timber_hs_use_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.final_timber_hs_use_val), 1), 1) - 1) as Final_Timber_Homestead_Use_Value,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.final_timber_hs_mkt_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.final_timber_hs_mkt_val), 1), 1) - 1) as Final_Timber_Homestead_Market_Value,
			
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.final_market), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.final_market), 1), 1) - 1) as final_market,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.final_appraised_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.final_appraised_val), 1), 1) - 1) as final_appraised_val,
	
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.final_rendered_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.final_rendered_val), 1), 1) - 1) as final_rendered_val,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.final_rendered_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.final_rendered_val), 1), 1) - 1) as final_rendered_val,
		
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.final_appraised_Classified), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.final_appraised_Classified), 1), 1) - 1) as Final_Senior_Appraised,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.final_appraised_NonClassified), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.final_appraised_NonClassified), 1), 1) - 1) as Final_NonSentor_Appraised,
		
		case when ((ap.final_appraised_Classified is NULL) and (ap.final_appraised_NonClassified is NULL))
		then NULL
		else
			LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(ap.final_appraised_Classified,0) + ISNULL(ap.final_appraised_NonClassified,0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(ap.final_appraised_Classified,0) + ISNULL(ap.final_appraised_NonClassified,0)), 1), 1) - 1) 
		end as Final_Total_Appraised,
	
		ap.final_exemptions,
	
		convert(varchar(10), ap.final_recalc_dt, 101) as final_recalc_dt,
		LEFT(CONVERT(varchar(20), CONVERT(money, pp.living_area), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pp.living_area), 1), 1) - 1) as living_area,
		ltrim(right(convert(varchar(20), prot_arrived_dt, 100),7)) as time_arrived,
		pv.hood_cd as neighborhood,
		pv.sub_market_cd,
		ap.prot_assigned_panel,
		LEFT(ISNULL(ap.prot_comments,''), 254) as general_comments,
		CASE WHEN ISNULL(aa.auth_to_resolve,'F') = 'T'
			THEN CONVERT(varchar(10), aaa.acct_id) + ' ' + aaa.file_as_name
			ELSE 'NONE'
		END as agent_resolve,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.begin_land_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.begin_land_hstd_val), 1), 1) - 1) as begin_land_hstd_val,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.begin_land_non_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.begin_land_non_hstd_val), 1), 1) - 1) as begin_land_non_hstd_val,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.begin_imprv_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.begin_imprv_hstd_val), 1), 1) - 1) as begin_imprv_hstd_val,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.begin_imprv_non_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.begin_imprv_non_hstd_val), 1), 1) - 1) as begin_imprv_non_hstd_val,
	
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.begin_ag_use_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.begin_ag_use_val), 1), 1) - 1) as Initial_Ag_NonHomestead_Use_Value,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.begin_ag_market), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.begin_ag_market), 1), 1) - 1) as Initial_Ag_NonHomestead_Market_Value,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.begin_timber_use), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.begin_timber_use), 1), 1) - 1) as Initial_Timber_NonHomestead_Use_Value,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.begin_timber_market), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.begin_timber_market), 1), 1) - 1) as Initial_Timber_NonHomestead_Market_Value,
		
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.begin_ag_hs_use_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.begin_ag_hs_use_val), 1), 1) - 1) as Initial_Ag_Homestead_Use_Value,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.begin_ag_hs_mkt_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.begin_ag_hs_mkt_val), 1), 1) - 1) as Initial_Ag_Homestead_Market_Value,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.begin_timber_hs_use_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.begin_timber_hs_use_val), 1), 1) - 1) as Initial_Timber_Homestead_Use_Value,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.begin_timber_hs_mkt_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.begin_timber_hs_mkt_val), 1), 1) - 1) as Initial_Timber_Homestead_Market_Value,	
		
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.begin_market), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.begin_market), 1), 1) - 1) as begin_market,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.begin_appraised_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.begin_appraised_val), 1), 1) - 1) as begin_appraised_val,
	
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.begin_rendered_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.begin_rendered_val), 1), 1) - 1) as begin_rendered_val,
		
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.begin_appraised_Classified), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.begin_appraised_Classified), 1), 1) - 1) as Initial_Senior_Appraised,
		LEFT(CONVERT(varchar(20), CONVERT(money, ap.begin_appraised_NonClassified), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ap.begin_appraised_NonClassified), 1), 1) - 1) as Initial_NonSenior_Appraised,
		
		case when ((ap.begin_appraised_Classified is NULL) and (ap.begin_appraised_NonClassified is NULL))
		then NULL
		else
			LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(ap.begin_appraised_Classified,0) + ISNULL(ap.begin_appraised_NonClassified,0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(ap.begin_appraised_Classified,0) + ISNULL(ap.begin_appraised_NonClassified,0)), 1), 1) - 1) 
		end	as Initial_Total_Appraised,

		ap.begin_exemptions,
	
		ap.appraiser_meeting_appraiser_comments as appraiser_comments,
		CONVERT(CHAR(11),ap.prot_appr_meeting_arrived_dt,101) + SUBSTRING(CONVERT(CHAR(19),ap.prot_appr_meeting_arrived_dt,100),13,19) as appraiser_meeting_arrival_date_time,
		dec1.decision_desc as motion1_desc,
		dec2.decision_desc as motion2_desc,
		dec1.decision_cd as motion1_decision_cd,
		dec2.decision_cd as motion2_decision_cd,
		h.appraiser_full_name as hearing_appraiser_name,
		m.appraiser_full_name as meeting_appraiser_name,
		opinion_of_value as opinion_of_value,
		decision_reason_cd as decision_reason_cd,
		@tax_year as tax_year

	FROM _arb_protest as ap
	WITH (NOLOCK)

	INNER JOIN property as p
	WITH (NOLOCK)
	ON ap.prop_id = p.prop_id

	INNER JOIN prop_supp_assoc as psa
	WITH (NOLOCK)
	ON ap.prop_id = psa.prop_id
	AND ap.prop_val_yr = psa.owner_tax_yr

	INNER JOIN property_val as pv
	WITH (NOLOCK)
	ON psa.prop_id = pv.prop_id
	AND psa.sup_num = pv.sup_num
	AND psa.owner_tax_yr = pv.prop_val_yr

	INNER JOIN wash_property_val as wpv
	WITH (NOLOCK)
	ON psa.prop_id = wpv.prop_id
	AND psa.sup_num = wpv.sup_num
	AND psa.owner_tax_yr = wpv.prop_val_yr

	INNER JOIN property_profile as pp
	WITH (NOLOCK)
	ON pv.prop_id = pp.prop_id
	AND pv.prop_val_yr = pp.prop_val_yr

	LEFT OUTER JOIN situs as s
	WITH (NOLOCK)
	ON ap.prop_id = s.prop_id
	AND s.primary_situs = 'Y'

	LEFT OUTER JOIN appraiser
	WITH (NOLOCK)
	ON pv.last_appraiser_id = appraiser.appraiser_id

	LEFT OUTER JOIN appraiser as appraiser1 
	WITH (NOLOCK)
	ON ap.prot_appraisal_staff = appraiser1.appraiser_id

	LEFT OUTER JOIN _arb_protest_hearing_docket as docket
	WITH (NOLOCK)
	ON ap.docket_id = docket.docket_id

	INNER JOIN owner as o 
	WITH (NOLOCK)
	ON o.prop_id = psa.prop_id 
	AND o.owner_tax_yr = psa.owner_tax_yr
	AND o.sup_num = psa.sup_num
 
	LEFT OUTER JOIN agent_assoc as aa
	WITH (NOLOCK)
	ON psa.owner_tax_yr = aa.owner_tax_yr
	AND psa.prop_id = aa.prop_id
	AND o.owner_id = aa.owner_id
	--AND aa.arb_mailings = 'T'

	LEFT OUTER JOIN account as aaa
	WITH (NOLOCK)
	ON aa.agent_id = aaa.acct_id

	LEFT OUTER JOIN _arb_protest_decision as dec1 
	WITH (NOLOCK)
	on dec1.decision_cd = ap.prot_first_motion_decision_cd

	LEFT OUTER JOIN _arb_protest_decision as dec2 
	WITH (NOLOCK)
	on dec2.decision_cd = ap.prot_second_motion_decision_cd

	LEFT OUTER JOIN appraiser as h with(nolock) on
		h.appraiser_id = ap.prot_hearing_appraisal_staff
	LEFT OUTER JOIN appraiser as m with(nolock) on
		m.appraiser_id = ap.appraiser_meeting_appraiser_id


	WHERE ap.case_id = @case_id
	AND ap.prop_val_yr = @prop_val_yr
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
		
		'Property ID'				as prop_id,
		'Case ID'					as case_id,
		'Appraisal Year'			as prop_val_yr,
		
		-- protest by address info
		'Protest By ID'				as prot_by_id,
		'Protester Address'			as file_as_addr_format,
		'Protester Name'			as file_as_name,		
		'Protester Name and Address'		as prot_by_name_address,
		'Protester Name and Address (5 Lines)'	as prot_by_name_address,
		'Protester Name and Address (6 Lines - Intl)'	as prot_by_name_address_6lines,
		'Protester Address Line 1'		as addr_line1,
		'Protester Address Line 2'		as addr_line2,
		'Protester Address Line 3'		as addr_line3,
		'Protester Address City'		as addr_city,
		'Protester Address State'		as addr_state,
		'Protester Address Zip'			as addr_zip,
		'Protester Address Country Code'	as addr_country_cd,
		'Protester Address Country Name'	as addr_country_name,
		'Protester Zip'				as zip,
		'Protester Cass'			as cass,
		'Protester Route'			as route,
		'Protester Zip Barcode'			as ZIP_BARCODE,
		
		-- primary protest by address info
		'Primary Protest By ID'				as primary_prot_by_id,
		'Primary Protester Name'			as primary_file_as_name,
		'Primary Protester Name and Address'		as primary_name_address,
		'Primary Protester Name and Address (5 Lines)'	as primary_name_address,
		'Primary Protester Name and Address (6 Lines - Intl)'	as primary_name_address_6lines,
		'Primary Protester Address Line 1'		as primary_addr_line1,
		'Primary Protester Address Line 2'		as primary_addr_line2,
		'Primary Protester Address Line 3'		as primary_addr_line3,
		'Primary Protester Address City'		as primary_addr_city,
		'Primary Protester Address State'		as primary_addr_state,
		'Primary Protester Address Zip'			as primary_addr_zip,
		'Primary Protester Address Country Code'	as primary_addr_country_cd,
		'Primary Protester Address Country Name'	as primary_addr_country_name,
		'Primary Protester Zip'				as primary_zip,
		'Primary Protester Cass'			as primary_cass,
		'Primary Protester Route'			as primary_route,
		'Primary Protester Zip Barcode'			as primary_ZIP_BARCODE,
		
		-- property owner address info
		'Owner Name'					as owner_name,
		'Owner Address'					as owner_addr_format,
		'Owner Name and Address'		as owner_name_address,
		'Owner Name and Address (5 Lines)'	as owner_name_address,
		'Owner Name and Address (6 Lines - Intl)'	as owner_name_address_6lines,
		'Owner Address Line 1'			as owner_addr_line1,
		'Owner Address Line 2'			as owner_addr_line2,
		'Owner Address Line 3'			as owner_addr_line3,
		'Owner Address City'			as owner_addr_city,
		'Owner Address State'			as owner_addr_state,
		'Owner Address Zip'				as owner_addr_zip,
		'Owner Address Country Code'	as owner_addr_country_cd,
		'Owner Address Country Name'	as owner_addr_country_name,
		'Owner Zip'						as owner_zip,
		'Owner Cass'					as owner_cass,
		'Owner Route'					as owner_route,
		'Owner Zip Barcode'				as owner_ZIP_BARCODE,

		'Property Geo ID'				as geo_id,
		'Property Ref ID 1'				as ref_id1,
		'Property Ref ID 2'				as ref_id2,

		'Appraiser Initials'			as appraiser_nm,
		'Appraiser Name'				as appraiser_full_name,
		'Protest Creation Date'			as create_dt,

		'Staff Appraiser Initials'		as staff_appraiser,
		'Staff Appraiser Name'			as staff_appraiser_full_name,
		'Property Condition Code'		as condition_code,
		'Property Heat/AC Code'			as heat_ac_code,
		'Property Use Code'				as property_use_code,
		'Land Size'						as land_size,
		'Actual Age'					as actual_age,
		'No. of Bedrooms'				as bedrooms,
		'No. of Bathrooms'				as bathrooms,
		'No. of Fireplaces'				as fireplaces,
		'No. of Improvements'			as number_of_units,

		'Property Legal Description'	as legal_desc,
		'Property Legal Desc. (Truncated)'  as legal_desc_40,
		'Ag Value'						as ag_value,
		'Land Homestead Value'			as land_hstd_val,
		'Land Market Value'				as land_mkt_val,
		-- current_market is a copy of market_val
		
		'Docket Date'					as docket_date,
		'Docket Start Time'				as docket_begin,
		'Docket End Time'				as docket_end,

		'Taxpayer Comments'				as prot_taxpayer_comments,
		'Situs Address'					as situs,
		'Protest Type'					as prot_type,
		'Ag Flag'						as ag_flag,

		'Current Imprv Homestead Value'	as current_imprv_hstd_val,
		'Current Imprv Non-homestead Value'	as current_imprv_non_hstd_val,
		'Current Imprv Value'			as current_imprv_val,
		'Current Imprv Value per Sq. Ft.'	as current_imprv_val_per_sqft,
		'Current Land and Imprv Total Value' as current_imprv_land_val,
	
		'Current Ag/Timber Non-homestead Market Value'	as Current_Ag_Timber_NonHomestead_Market_value,
		'Current Ag/Timber Non-Homestead Use Value'		as Current_Ag_Timber_NonHomestead_Use_value,
		'Current Ag/Timber Homestead Market Value'	as Current_Ag_Timber_Homestead_Market_value,
		'Current Ag/Timber Homestead Use Value'		as Current_Ag_Timber_Homestead_Use_Value,
						
	
		'Current Recalc Date'			as current_recalc_dt,
		'Current Market Value'			as market_val,
		'Current Market Value per Sq. Ft.'	as current_market_val_per_sqft,
	
		'Current Rendered Value'		as current_rendered,
		'Current Exemptions List'		as exemptions,
		
		
		'Current Senior Appraised'		as Current_Senior_Appraised,
		'Current Non-Senior Appraised'	as Current_NonSenior_Appraised,
		'Current Total Appraised'		as Current_Total_Appraised,

		'Affidavit Testimony Method'	as at_method,
		'Affidavit Testimony By'		as at_from,
		'ARB Agent Name'				as arb_agent_name,
		'ARB Agent ID'					as arb_agent_id,

		'Final Land Homestead Value'	as final_land_hstd_val,
		'Final Land Non-homestead Value'	as final_land_non_hstd_val,
		'Final Imprv Homestead Value'	as final_imprv_hstd_val,
		'Final Imprv Non-homestead Value'	as final_imprv_non_hstd_val,
	
		'Final Ag Non-homestead Use Value'			as Final_Ag_NonHomestead_Use_Value,
		'Final Ag Non-homestead Market Value'			as Final_Ag_NonHomestead_Market_Value,
		'Final Timber Non-Homestead Use Value'		as Final_Timber_NonHomestead_Use_value,
		'Final Timber Non-homestead Market Value'		as Final_Timber_NonHomestead_Market_Value,
		
		'Final Ag Homestead Use Value' as Final_Ag_Homestead_Use_Value,
		'Final Ag Homestead Market Value' as Final_Ag_Homestead_Market_Value,
		'Final Timber Homestead Use Value'  as Final_Timber_Homestead_Use_Value,
		'Final Timber Homestead Market Value' as Final_Timber_Homestead_Market_Value,
		
		'Final Market Value'			as final_market,
		'Final Appraised Value'			as final_appraised_val,
		
		'Final Rendered Value'			as final_rendered_val,		
		
		'Final Senior Appraised'		as Final_Senior_Appraised,
		'Final Non-Senior Appraised'	as Final_NonSentor_Appraised,
		'Final Total Appraised'			as Final_Total_Appraised,
		
		'Final Exemptions List'			as final_exemptions,
	
		'Final Recalc Date'				as final_recalc_dt,

		'Living Area'					as living_area,
		'Time Arrived'					as time_arrived,
		'Neighborhood Code'				as neighborhood,
		'Sub-market Code'				as sub_market_cd,
		'Protest Assigned Panel'		as prot_assigned_panel,
		'General Comments'				as general_comments,
		'Agent Authorized to Resolve'	as agent_resolve,

		'Initial Land Homestead Value'	as begin_land_hstd_val,
		'Initial Land Non-homestead Value'	as begin_land_non_hstd_val,
		'Initial Imprv Homestead Value'	as begin_imprv_hstd_val,
		'Initial Imprv Non-homestead Value' as begin_imprv_non_hstd_val,
	
		'Initial Ag Non-homestead Use Value'	as Initial_Ag_NonHomestead_Use_Value,
		'Initial Ag Non-homestead Market Value'		as Initial_Ag_NonHomestead_Market_value,
		'Initial Timber Non-homestead Use Value'		as Initial_Timber_NonHomestead_Use_Value,
		'Initial Timber Non-homestead Market Value'	as Initial_Timber_NonHomestead_Market_Value,
	
		'Initial Ag Homestead Use Value'		as Initial_Ag_Homestead_Use_Value,
		'Initial Ag Homestead Market Value'		as Initial_Ag_Homestead_Market_Value,
		'Initial Timber Homestead Use Value'	as Initial_Timber_Homestead_Use_Value,
		'Initial Timber Homestead Market Value'		as Initial_Timber_Homestead_Market_Value,
		
		'Initial Market Value'			as begin_market,
		'Initial Appraised Value'		as begin_appraised_val,
	
		'Initial Rendered Value'		as begin_rendered_val,
				
				
		'Initial Senior Appraised'		as Initial_Senior_Appraised,
		'Initial Non-Senior Appraised'	as Initial_NonSenior_Appraised,
		'Initial Total Appraised'		as Initial_Total_Appraised,
			
		'Initial Exemptions List'		as begin_exemptions,
	
		'Appraiser Comments'			as appraiser_comments,
		'Appraiser Meeting Arrival Date and Time' as appraiser_meeting_arrival_date_time,
		'Motion 1 Decision Code Description'		as motion1_desc,
		'Motion 2 Decision Code Description'		as motion2_desc,
		'Motion 1 Decision Code'			as motion1_decision_cd,
		'Motion 2 Decision Code'			as motion2_decision_cd,
		'Hearing Appraiser Name'			as hearing_appraiser_name,
		'Meeting Appraiser Name'			as meeting_appraiser_name,
		'Opinion of Value'				as opinion_of_value,
		'Decision Reason Code'				as decision_reason_cd,
		'Tax Year'							as tax_year
END

GO

