

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

CREATE PROCEDURE AI

	@case_id int,
	@ID1 int,
	@ID2 int = NULL
as

IF @case_id > 0
BEGIN
	DECLARE @prop_val_yr int
	DECLARE @prot_by_id int

	if @ID2 is NULL 
		set @prop_val_yr = @ID1
	else
	begin
		set @prop_val_yr = @ID2
		set @prot_by_id = @ID1
	end


	declare @prop_id int
	declare @inq_by_id int
	declare @entity_cd varchar(10)
	declare @entities varchar(200)
	declare @exempt_cd varchar(10)
	declare @exemptions varchar(200)
	declare @tax_year numeric(4,0)

	set @entities = ''
	set @exemptions = ''

	SELECT @prop_id = prop_id,
		@inq_by_id = inq_by_id --Added 06/07/2004 ELZ
	FROM _arb_inquiry as ai
	WITH (NOLOCK)
	WHERE ai.case_id = @case_id
	AND ai.prop_val_yr = @prop_val_yr
	
	select
		@tax_year = appr_yr + 1
	from
		pacs_system with (nolock)

	--HS 38241
	declare @agent_id int
	
	SELECT
		@agent_id = aaa.acct_id
	FROM _arb_inquiry as ai WITH (NOLOCK)
	
	INNER JOIN property as p 
		WITH (NOLOCK)
		ON ai.prop_id = p.prop_id
	INNER JOIN prop_supp_assoc as psa 
		WITH (NOLOCK)
		ON ai.prop_id = psa.prop_id
		AND ai.prop_val_yr = psa.owner_tax_yr
	INNER JOIN property_val as pv 
		WITH (NOLOCK)
		ON psa.prop_id = pv.prop_id
		AND psa.sup_num = pv.sup_num
		AND psa.owner_tax_yr = pv.prop_val_yr
	INNER JOIN owner as o 
		WITH (NOLOCK)
		ON pv.prop_id = o.prop_id
		AND pv.sup_num = o.sup_num
		AND pv.prop_val_yr = o.owner_tax_yr
	LEFT OUTER JOIN agent_assoc as aa 
		WITH (NOLOCK)
		ON o.owner_tax_yr = aa.owner_tax_yr
		AND o.prop_id = aa.prop_id
		AND o.owner_id = aa.owner_id
	LEFT OUTER JOIN account as aaa
		WITH (NOLOCK)
		ON aa.agent_id = aaa.acct_id
	WHERE 
		ai.prop_id = @prop_id AND
		ai.prop_val_yr = @prop_val_yr
	--

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

	--HS 38241
	/* Get the Agent address in a format without unnecessary line breaks */
	declare
		@szAgentAddressMain 	varchar(512),
		@szAgentAddressCity 	varchar(50),
		@szAgentAddressState 	varchar(50),
		@szAgentAddressZip 	varchar(50)
	
	exec GetPrintAddress
		@agent_id,
		@szAgentAddressMain output,
		@szAgentAddressCity output,
		@szAgentAddressState output,
		@szAgentAddressZip output
	--

	-- get the inquiry by address information
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
			a.acct_id = @inq_by_id

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
	SELECT TOP 1 
			@case_id			as case_id,
			@prop_id			as prop_id,
			@prop_val_yr		as prop_val_yr,
			appraiser.appraiser_full_name,
			appraiser.appraiser_nm,
			convert(varchar(10), inq_create_dt, 101) as create_dt,
			convert(varchar(10), inq_create_dt, 108) as create_tm,
			isnull(a.confidential_file_as_name, a.file_as_name) as file_as_name,
			p.geo_id,
			p.ref_id1,
			p.ref_id2,
			@full_addr as addr_main, --Added 06/07/2004 ELZ
			dbo.fn_Address(
				isnull(a.confidential_file_as_name, a.file_as_name), 
				ad.addr_line1,
				ad.addr_line2,
				ad.addr_line3,
				ad.addr_city,
				ad.addr_state,
				ad.addr_zip,
				country.country_name,
				ad.is_international,
				5
			) as NAME_ADDRESS,
			dbo.fn_Address(
				isnull(a.confidential_file_as_name, a.file_as_name), 
				ad.addr_line1,
				ad.addr_line2,
				ad.addr_line3,
				ad.addr_city,
				ad.addr_state,
				ad.addr_zip,
				country.country_name,
				ad.is_international,
				5
			) as NAME_ADDRESS_5LINES,
			dbo.fn_Address(
				isnull(a.confidential_file_as_name, a.file_as_name), 
				ad.addr_line1,
				ad.addr_line2,
				ad.addr_line3,
				ad.addr_city,
				ad.addr_state,
				ad.addr_zip,
				country.country_name,
				ad.is_international,
				6
			) as NAME_ADDRESS_6LINES,
			ad.addr_line1,
			ad.addr_line2,
			ad.addr_line3,
			RTRIM(ISNULL(ad.addr_city,'')) as addr_city,
			RTRIM(ISNULL(ad.addr_state, '')) as addr_state,
			RTRIM(ISNULL(ad.addr_zip, '')) as addr_zip,
			ISNULL(ad.country_cd,'') as country_cd,
			ISNULL(country.country_name,'') as country_name,
			ISNULL(ad.is_international, 0) as is_international,
			ISNULL(ad.zip,'') as zip,
			ISNULL(ad.cass,'') as cass,
			ISNULL(ad.route,'') as route,
			ISNULL(ad.zip_4_2,'') as ZIP_BARCODE,
			p1.phone_num as home_phone_num,
			p2.phone_num as bus_phone_num,
			@exemptions as exemptions,
			
			ai.inq_type,
			ai.inq_nature,
			appraiser1.appraiser_nm as staff_appraiser,
			appraiser1.appraiser_full_name as staff_appraiser_full_name,
			LEFT(REPLACE(REPLACE(ai.inq_taxpayer_comments, char(13), ' '), char(10), ' '), 254) as inq_taxpayer_comments,
			LEFT(REPLACE(REPLACE(ai.inq_appraiser_comments, char(13), ' '), char(10), ' '), 254) as inq_appraiser_comments,
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
			pv.legal_desc,
			pp.state_cd,
			LTRIM(REPLACE(s.situs_display, CHAR(13) + CHAR(10), ' ')) as situs,
			p.dba_name,
			LEFT(REPLACE(REPLACE(ai.inq_operator_comments, char(13), ' '), char(10), ' '), 254) as inq_operator_comments,
			CASE WHEN ISNULL(pv.ag_use_val,0) + ISNULL(pv.ag_market,0) = 0
				THEN 'N'
				ELSE 'Y'
			END as ag_flag,
			LEFT(CONVERT(varchar(20), CONVERT(money, pv.imprv_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.imprv_hstd_val), 1), 1) - 1) as current_imprv_hstd_val,
			LEFT(CONVERT(varchar(20), CONVERT(money, pv.imprv_non_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.imprv_non_hstd_val), 1), 1) - 1) as current_imprv_non_hstd_val,
			LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), 1) - 1) as current_imprv_val,
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
		
			CASE WHEN EXISTS(SELECT prop_id
							FROM _arb_protest
							WITH (NOLOCK)
							WHERE prop_id = ai.prop_id
							AND prop_val_yr = ai.prop_val_yr)
				THEN 'Y'
				ELSE ''
				END as active_protest,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.final_land_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.final_land_hstd_val), 1), 1) - 1) as final_land_hstd_val,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.final_land_non_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.final_land_non_hstd_val), 1), 1) - 1) as final_land_non_hstd_val,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.final_imprv_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.final_imprv_hstd_val), 1), 1) - 1) as final_imprv_hstd_val,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.final_imprv_non_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.final_imprv_non_hstd_val), 1), 1) - 1) as final_imprv_non_hstd_val,
			
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.final_ag_use_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.final_ag_use_val), 1), 1) - 1) as Final_Ag_NonHomestead_Use_Value,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.final_ag_market), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.final_ag_market), 1), 1) - 1) as Final_Ag_NonHomestead_Market_Value,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.final_timber_use), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.final_timber_use), 1), 1) - 1) as Final_Timber_NonHomestead_Use_value,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.final_timber_market), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.final_timber_market), 1), 1) - 1) as Final_Timber_NonHomestead_Market_Value,
		
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.final_ag_hs_use_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.final_ag_hs_use_val), 1), 1) - 1) as Final_Ag_Homestead_Use_Value,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.final_ag_hs_mkt_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.final_ag_hs_mkt_val), 1), 1) - 1) as Final_Ag_Homestead_Market_Value,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.final_timber_hs_use_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.final_timber_hs_use_val), 1), 1) - 1) as Final_Timber_Homestead_Use_Value,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.final_timber_hs_mkt_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.final_timber_hs_mkt_val), 1), 1) - 1) as Final_Timber_Homestead_Market_Value,
		
		
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.final_market), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.final_market), 1), 1) - 1) as final_market,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.final_appraised_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.final_appraised_val), 1), 1) - 1) as final_appraised_val,
		
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.final_rendered_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.final_rendered_val), 1), 1) - 1) as final_rendered_val,
		
		
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.final_appraised_Classified), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.final_appraised_Classified), 1), 1) - 1) as Final_Senior_Appraised,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.final_appraised_NonClassified), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.final_appraised_NonClassified), 1), 1) - 1) as Final_NonSentor_Appraised,

			case when ((ai.final_appraised_Classified is NULL) and (ai.final_appraised_NonClassified is NULL))
			then NULL
			else
				LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(ai.final_appraised_Classified,0) + ISNULL(ai.final_appraised_NonClassified,0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(ai.final_appraised_Classified,0) + ISNULL(ai.final_appraised_NonClassified,0)), 1), 1) - 1) 
			end as Final_Total_Appraised,
	
		
			ai.final_exemptions,
		
			convert(varchar(10), ai.final_recalc_dt, 101) as final_recalc_dt,
			aaa.file_as_name as arb_agent_name,
			aaa.acct_id as arb_agent_id,
			--HS 38241
			@szAgentAddressMain as arb_agent_addr_main,
			@szAgentAddressCity as arb_agent_addr_city,
			@szAgentAddressState as arb_agent_addr_state,
			@szAgentAddressZip as arb_agent_addr_zip,
			--
			convert(varchar(10),docket.docket_start_date_time, 101)  as docket_date,
			convert(varchar(10),docket.docket_start_date_time,  108) as docket_begin,
			LEFT(CONVERT(varchar(20), CONVERT(money, pp.living_area), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pp.living_area), 1), 1) - 1) as living_area,
			aai.file_as_name as inquiry_by_name,
			CASE WHEN ISNULL(aa.auth_to_resolve,'F') = 'T'
				THEN CONVERT(varchar(10), aaa.acct_id) + ' ' + aaa.file_as_name
				ELSE 'NONE'
				END as agent_resolve,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.begin_land_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.begin_land_hstd_val), 1), 1) - 1) as begin_land_hstd_val,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.begin_land_non_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.begin_land_non_hstd_val), 1), 1) - 1) as begin_land_non_hstd_val,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.begin_imprv_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.begin_imprv_hstd_val), 1), 1) - 1) as begin_imprv_hstd_val,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.begin_imprv_non_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.begin_imprv_non_hstd_val), 1), 1) - 1) as begin_imprv_non_hstd_val,
		
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.begin_ag_use_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.begin_ag_use_val), 1), 1) - 1) as Initial_Ag_NonHomestead_Use_Value,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.begin_ag_market), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.begin_ag_market), 1), 1) - 1) as Initial_Ag_NonHomestead_Market_Value,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.begin_timber_use), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.begin_timber_use), 1), 1) - 1) as Initial_Timber_NonHomestead_Use_Value,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.begin_timber_market), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.begin_timber_market), 1), 1) - 1) as Initial_Timber_NonHomestead_Market_Value,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.begin_market), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.begin_market), 1), 1) - 1) as begin_market,
		
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.begin_ag_hs_use_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.begin_ag_hs_use_val), 1), 1) - 1) as Initial_Ag_Homestead_Use_Value,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.begin_ag_hs_mkt_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.begin_ag_hs_mkt_val), 1), 1) - 1) as Initial_Ag_Homestead_Market_Value,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.begin_timber_hs_use_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.begin_timber_hs_use_val), 1), 1) - 1) as Initial_Timber_Homestead_Use_Value,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.begin_timber_hs_mkt_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.begin_timber_hs_mkt_val), 1), 1) - 1) as Initial_Timber_Homestead_Market_Value,	
		
		
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.begin_appraised_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.begin_appraised_val), 1), 1) - 1) as begin_appraised_val,
			
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.begin_rendered_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.begin_rendered_val), 1), 1) - 1) as begin_rendered_val,
		
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.begin_appraised_Classified), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.begin_appraised_Classified), 1), 1) - 1) as Initial_Senior_Appraised,
			LEFT(CONVERT(varchar(20), CONVERT(money, ai.begin_appraised_NonClassified), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ai.begin_appraised_NonClassified), 1), 1) - 1) as Initial_NonSenior_Appraised,
	
			case when ((ai.begin_appraised_Classified is NULL) and (ai.begin_appraised_NonClassified is NULL))
			then NULL
			else
				LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(ai.begin_appraised_Classified,0) + ISNULL(ai.begin_appraised_NonClassified,0)), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(ai.begin_appraised_Classified,0) + ISNULL(ai.begin_appraised_NonClassified,0)), 1), 1) - 1) 
			end	as Initial_Total_Appraised,

		
			ai.begin_exemptions,
			
			@tax_year as tax_year

        
	FROM _arb_inquiry as ai
	WITH (NOLOCK)

	INNER JOIN property as p
	WITH (NOLOCK)
	ON ai.prop_id = p.prop_id

	INNER JOIN prop_supp_assoc as psa
	WITH (NOLOCK)
	ON ai.prop_id = psa.prop_id
	AND ai.prop_val_yr = psa.owner_tax_yr

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


	INNER JOIN owner as o 
	WITH (NOLOCK)
	ON pv.prop_id = o.prop_id
	AND pv.sup_num = o.sup_num
	AND pv.prop_val_yr = o.owner_tax_yr

	INNER JOIN property_profile as pp
	WITH (NOLOCK)
	ON pv.prop_id = pp.prop_id
	AND pv.prop_val_yr = pp.prop_val_yr

	LEFT OUTER JOIN account as a
	WITH (NOLOCK)
	ON @inq_by_id = a.acct_id

	LEFT OUTER JOIN account as aai
	WITH (NOLOCK)
	ON ai.inq_by_id = aai.acct_id

	LEFT OUTER JOIN situs as s
	WITH (NOLOCK)
	ON ai.prop_id = s.prop_id
	AND s.primary_situs = 'Y'

	LEFT OUTER JOIN address as ad
	WITH (NOLOCK)
	ON a.acct_id = ad.acct_id 
	AND ad.primary_addr = 'Y'

	LEFT OUTER JOIN country
	WITH (NOLOCK)
	ON ad.country_cd = country.country_cd

	LEFT OUTER JOIN agent_assoc as aa
	WITH (NOLOCK)
	ON o.owner_tax_yr = aa.owner_tax_yr
	AND o.prop_id = aa.prop_id
	AND o.owner_id = aa.owner_id
	--AND aa.arb_mailings = 'T'

	LEFT OUTER JOIN account as aaa
	WITH (NOLOCK)
	ON aa.agent_id = aaa.acct_id

	LEFT OUTER JOIN appraiser
	WITH (NOLOCK)
	ON pv.last_appraiser_id = appraiser.appraiser_id

	LEFT OUTER JOIN appraiser as appraiser1 
	WITH (NOLOCK)
	ON ai.inq_appraisal_staff = appraiser1.appraiser_id

	LEFT OUTER JOIN phone as p1
	WITH (NOLOCK)
	ON a.acct_id = p1.acct_id
	AND p1.phone_type_cd = 'H'

	LEFT OUTER JOIN phone as p2
	WITH (NOLOCK)
	ON a.acct_id = p2.acct_id
	AND p2.phone_type_cd = 'B'

	LEFT OUTER JOIN _arb_protest as ap
	WITH (NOLOCK)
	ON ai.prop_id = ap.prop_id
	and ai.prop_val_yr = ap.prop_val_yr
	and ap.docket_id is not null

	LEFT OUTER JOIN _arb_protest_hearing_docket as docket
	WITH (NOLOCK)
	ON ap.docket_id = docket.docket_id

	WHERE ai.case_id = @case_id
	AND   ai.prop_val_yr = @prop_val_yr
END
ELSE
BEGIN
	SELECT 	
		'Appraiser Full Name' 	AS appraiser_full_name,
		'Appraiser Initials' 	AS appraiser_nm,
		'Case ID'				AS case_id,
		'Inquiry Create Date'	AS create_dt,
		'Inquiry Create Time'	AS create_tm,
		'Property ID'			AS prop_id,
		'Tax Year'				AS prop_val_yr,
		'Inquiry By Full Name'	AS file_as_name,
		'Geo ID'				AS geo_id,
		'Ref ID1'				AS ref_id1,
		'Ref ID2'				AS ref_id2,
		'Inquiry By Address'	AS addr_main, 
		'Inquiry By Name and Address' AS NAME_ADDRESS,
		'Inquiry By Name and Address (5 Lines)' AS NAME_ADDRESS,
		'Inquiry By Name and Address (6 Lines - Intl)' AS NAME_ADDRESS_6LINES,
		'Address Line 1' 		AS addr_line1,
		'Address Line 2' 		AS addr_line2,
		'Address Line 3' 		AS addr_line3,
		'Address City' 			AS addr_city,
		'Address State' 		AS addr_state,
		'Address Zip' 			AS addr_zip,
		'Address Country Code'	AS country_cd,
		'Address Country Name'	AS country_name,
		'zip'					AS zip,
		'cass'					AS cass,
		'route' 				AS route,
		'zip barcode' 			AS ZIP_BARCODE,
		'Home Phone'			AS home_phone_num,
		'Business Phone'		AS bus_phone_num,
		'Exemptions List'		as exemptions,
	
		'Inquiry Type'			AS inq_type,
		'Inquiry Nature'		AS inq_nature,
		'Staff Appraiser Initials' AS staff_appraiser,
		'Staff Appraiser Name'  AS staff_appraiser_full_name,
		'Taxpayer Comments' 	AS inq_taxpayer_comments,
		'Appraiser Comments'	AS inq_appraiser_comments,
		'Land Size'				AS land_size,
		'Legal Description'		AS legal_desc,
		'State Code'			AS state_cd,
		'Situs Address'			AS situs,
		'DBA Name'				AS dba_name,
		'Operator Comments'		AS inq_operator_comments,
		'Ag Flag'				AS ag_flag,
		'Current Imprv Homestead Value' 		AS current_imprv_hstd_val,
		'Current Imprv Non-homestead Value' 	AS current_imprv_non_hstd_val,
		'Current Imprv Value'					AS current_imprv_val,
		'Current Imprv Value per Sq. Ft.' 		as current_imprv_val_per_sqft,
		'Current Land Homestead Value' 			as current_land_hstd_val,
		'Current Land Non-homestead Value' 		as current_land_non_std_val,
		'Current Land Value' 					as current_land_val,
		'Current Land Value per Sq. Ft.' 		as current_land_val_per_sqft,
		'Current Imprv Land Value' 				as current_imprv_land_val,
	
		'Current Ag/Timber Non-homestead Market Value'		as Current_Ag_Timber_NonHomestead_Market_value,
		'Current Ag/Timber Non-Homestead Use Value'  		as Current_Ag_Timber_NonHomestead_Use_value,
		'Current Ag/Timber Homestead Market Value'	as Current_Ag_Timber_Homestead_Market_value,
		'Current Ag/Timber Homestead Use Value'		as Current_Ag_Timber_Homestead_Use_Value,
								
		
		'Current Recalc Date' 					as current_recalc_dt,
		'Current Market Value' 					as current_market,
		'Current Market Value per Sq. Ft.' 		as current_market_val_per_sqft,
		
		'Current Rendered Value' 				as current_rendered,
		
		'Current Senior Appraised'		as Current_Senior_Appraised,
		'Current Non-Senior Appraised'	as Current_NonSenior_Appraised,
		'Current Total Appraised'		as Current_Total_Appraised,
		
		'Active Protest Flag' 					AS active_protest,
		'Final Land Homestead Value' 			as final_land_hstd_val,
		'Final Land Non-homestead Value' 		as final_land_non_hstd_val,
		'Final Imprv Homestead Value' 			as final_imprv_hstd_val,
		'Final Imprv Non-homestead Value' 		as final_imprv_non_hstd_val,
		
		'Final Ag Non-homestead Use Value' 			as Final_Ag_NonHomestead_Use_Value,
		'Final Ag Non-homestead Market Value' 		as Final_Ag_NonHomestead_Market_Value,
		'Final Timber Non-homestead Use Value'		as Final_Timber_NonHomestead_Use_Value,
		'Final Timber Non-homestead Market Value'	as Final_Timber_NonHomestead_Market_Value,
		
		'Final Ag Homestead Use Value' 			as Final_Ag_Homestead_Use_Value,
		'Final Ag Homestead Market Value' 		as Final_Ag_Homestead_Market_Value,
		'Final Timber Homestead Use Value'		as Final_Timber_Homestead_Use_Value,
		'Final Timber Homestead Market Value'	as Final_Timber_Homestead_Market_Value,
		
		'Final Timber Use Value' 				as final_timber_use,
		'Final Timber Market Value' 			as final_timber_market,
		'Final Market Value' 					as final_market,
		'Final Appraised Value' 				as final_appraised_val,
		
		'Final Rendered Value' 					as final_rendered_val,
		
		'Final Senior Appraised'		as Final_Senior_Appraised,
		'Final Non-Senior Appraised'	as Final_NonSentor_Appraised,
		'Final Total Appraised'			as Final_Total_Appraised,
		
		'Final Exemptions List' 				as final_exemptions,
	
		'Final Recalc Date' 					as final_recalc_dt,
		'ARB Agent Name' 						AS arb_agent_name,
		'ARB Agent ID' 							AS arb_agent_id,
		'ARB Agent Address'						AS arb_agent_addr_main,
		'ARB Agent Address City'					AS arb_agent_addr_city,
		'ARB Agent Address State'					AS arb_agent_addr_state,
		'ARB Agent Address Zip'						AS arb_agent_addr_zip,
		'Docket Date' 							AS docket_date,
		'Docket Begin Date/Time' 				AS docket_begin,
		'Living Area' 							as living_area,
		'Inquiry By Name' 						AS inquiry_by_name,
		'Agent to Resolve' 						as agent_resolve,
		'Initial Land Homestead Value' 			as begin_land_hstd_val,
		'Initial Land Non-homestead Value' 		as begin_land_non_hstd_val,
		'Initial Imprv Homestead Value' 		as begin_imprv_hstd_val,
		'Initial Imprv Non-homestead Value'  	as begin_imprv_non_hstd_val,
	
		'Initial Ag Non-homestead Use Value' 	as Initial_Ag_NonHomestead_Use_Value,
		'Initial Ag Non-homestead Market Value' as Initial_Ag_NonHomestead_Market_value,
		'Initial Timber Non-homestead Use Value' 				as Initial_Timber_NonHomestead_Use_Value,
		'Initial Timber Non-homestead Market Value' 			as Initial_Timber_NonHomestead_Market_Value,
		
		'Initial Ag Homestead Use Value'		as Initial_Ag_Homestead_Use_Value,
		'Initial Ag Homestead Market Value'		as Initial_Ag_Homestead_Market_Value,
		'Initial Timber Homestead Use Value'	as Initial_Timber_Homestead_Use_Value,
		'Initial Timber Homestead Market Value'	as Initial_Timber_Homestead_Market_Value,
		
		'Initial Market Value' 					as begin_market,
		'Initial Appraised Value' 				as begin_appraised_val,
	
		'Initial Rendered Value' 				as begin_rendered_val,
		
		'Initial Senior Appraised'		as Initial_Senior_Appraised,
		'Initial Non-Senior Appraised'	as Initial_NonSenior_Appraised,
		'Initial Total Appraised'		as Initial_Total_Appraised,
		
		'Initial Exemptions List' 				as begin_exemptions,
	
		'Tax Year' 								as tax_year
END

GO

