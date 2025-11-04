
CREATE PROCEDURE LetterMerge

	@id1 int,
	@id2 int,
	@letter_type varchar(20)

AS

--Revision History
--1.0 Created
--1.1 12/10/2003 ELZ; added a bunch of fields and reformatted the stored proc to look more presentable

	IF @letter_type = 'PROPERTY'
	BEGIN
		IF @id1 <> 0
		BEGIN
			--Get current year
			declare @year int

			SELECT @year = appr_yr
			FROM pacs_system
			WHERE system_type IN ('A','C')

			declare @exempt_code as varchar(5)
			declare @exemptions as varchar(200)
			declare @entity_code as varchar(5)
			declare @entities as varchar(200)

			--Get Exemptions
			SET @exemptions = ''

			declare EXEMPTIONS CURSOR FAST_FORWARD
			FOR SELECT RTRIM(exmpt_type_cd)
				FROM property_exemption
				WHERE prop_id = @id1
					AND owner_id = @id2
					AND exmpt_tax_yr = @year
					AND exmpt_type_cd <> 'AG'

			OPEN EXEMPTIONS

			FETCH NEXT FROM EXEMPTIONS INTO @exempt_code

			WHILE @@FETCH_STATUS = 0
			BEGIN
				IF LEN(@exemptions) <> 0
				BEGIN
					SET @exemptions = @exemptions + ', '
				END
				SET @exemptions = @exemptions + @exempt_code

				FETCH NEXT FROM EXEMPTIONS INTO @exempt_code
			END

			CLOSE EXEMPTIONS
			DEALLOCATE EXEMPTIONS

			--Get Entities
			SET @entities = ''

			declare ENTITIES CURSOR FAST_FORWARD

			FOR SELECT RTRIM(entity_cd)
				FROM entity_prop_assoc as epa

				INNER JOIN prop_supp_assoc as psa
				ON epa.prop_id = psa.prop_id
					AND epa.tax_yr = psa.owner_tax_yr

				INNER JOIN entity
				ON epa.entity_id = entity.entity_id

				WHERE epa.prop_id = @id1
					AND epa.tax_yr = @year

			OPEN ENTITIES

			FETCH NEXT FROM ENTITIES INTO @entity_code

			WHILE @@FETCH_STATUS = 0
			BEGIN
				IF LEN(@entities) <> 0
				BEGIN
					SET @entities = @entities + ', '
				END

				SET @entities = @entities + @entity_code

				FETCH NEXT FROM ENTITIES INTO @entity_code
			END

			CLOSE ENTITIES
			DEALLOCATE ENTITIES

			--Get CA Agent Info
			declare @ca_agent_id as int
			declare @ca_agent_name as varchar(70)
			declare @ca_addr_line1 as varchar(60)
			declare @ca_addr_line2 as varchar(60)
			declare @ca_addr_line3 as varchar(60)
			declare @ca_addr_city as varchar(50)
			declare @ca_addr_state as varchar(50)
			declare @ca_addr_zip as varchar(50)
			declare @ca_addr_country as varchar(5)
			declare @ca_addr_csz	as varchar(150)
			declare @ca_addr_country_name varchar(50)
			declare @ca_addr_is_international bit

			SELECT @ca_agent_id = ISNULL(agent_assoc.agent_id, 0),
					@ca_agent_name = ISNULL(account.file_as_name, ''),
					@ca_addr_line1 = ISNULL(address.addr_line1, ''),
					@ca_addr_line2 = ISNULL(address.addr_line2, ''),
					@ca_addr_line3 = ISNULL(address.addr_line3, ''),
					@ca_addr_city = ISNULL(address.addr_city, ''),
					@ca_addr_state = ISNULL(address.addr_state, ''),
					@ca_addr_zip = ISNULL(address.addr_zip, ''),
					@ca_addr_country = RTRIM(ISNULL(address.country_cd, '')),
					@ca_addr_country_name = isnull(country.country_name, ''),
					@ca_addr_is_international = isnull(address.is_international, 0)

			FROM agent_assoc

			INNER JOIN account
			ON agent_assoc.agent_id = account.acct_id

			INNER JOIN address
			ON account.acct_id = address.acct_id
				AND address.primary_addr = 'Y'

			LEFT OUTER JOIN phone
			ON account.acct_id = phone.acct_id

			LEFT OUTER JOIN country with (nolock)
			ON country.country_cd = address.country_cd

			WHERE prop_id = @id1
				AND owner_tax_yr = @year
				AND owner_id = @id2
				AND ISNULL(exp_dt, getdate() + 1) > getdate()
				AND ca_mailings = 'T'

			set @ca_addr_csz = rtrim(@ca_addr_city) + ', ' + rtrim(@ca_addr_state) + ' ' + rtrim(@ca_addr_zip)

			--Get Entity Agent Info
			declare @ent_agent_id as int
			declare @ent_agent_name as varchar(70)
			declare @ent_addr_line1 as varchar(60)
			declare @ent_addr_line2 as varchar(60)
			declare @ent_addr_line3 as varchar(60)
			declare @ent_addr_city as varchar(50)
			declare @ent_addr_state as varchar(50)
			declare @ent_addr_zip as varchar(50)
			declare @ent_addr_country as varchar(5)
			declare @ent_addr_country_name varchar(50)
			declare @ent_addr_is_international bit

			SELECT @ent_agent_id = ISNULL(agent_assoc.agent_id, 0),
					@ent_agent_name = ISNULL(account.file_as_name, ''),
					@ent_addr_line1 = ISNULL(address.addr_line1, ''),
					@ent_addr_line2 = ISNULL(address.addr_line2, ''),
					@ent_addr_line3 = ISNULL(address.addr_line3, ''),
					@ent_addr_city = ISNULL(address.addr_city, ''),
					@ent_addr_state = ISNULL(address.addr_state, ''),
					@ent_addr_zip = ISNULL(address.addr_zip, ''),
					@ent_addr_country = RTRIM(ISNULL(address.country_cd, '')),
					@ent_addr_country_name = isnull(country.country_name, ''),
					@ent_addr_is_international = isnull(address.is_international, 0)

			FROM agent_assoc

			INNER JOIN account
			ON agent_assoc.agent_id = account.acct_id

			INNER JOIN address
			ON account.acct_id = address.acct_id
				AND address.primary_addr = 'Y'

			LEFT OUTER JOIN country with (nolock)
			ON country.country_cd = address.country_cd

			WHERE prop_id = @id1
				AND owner_tax_yr = @year
				AND owner_id = @id2
				AND ISNULL(exp_dt, getdate() + 1) > getdate()
				AND ent_mailings = 'T'

			--Get ARB Agent Info
			declare @arb_agent_id as int
			declare @arb_agent_name as varchar(70)
			declare @arb_addr_line1 as varchar(60)
			declare @arb_addr_line2 as varchar(60)
			declare @arb_addr_line3 as varchar(60)
			declare @arb_addr_city as varchar(50)
			declare @arb_addr_state as varchar(50)
			declare @arb_addr_zip as varchar(50)
			declare @arb_addr_country as varchar(5)
			declare @arb_addr_country_name varchar(50)
			declare @arb_addr_is_international bit

			SELECT @arb_agent_id = ISNULL(agent_assoc.agent_id, 0),
					@arb_agent_name = ISNULL(account.file_as_name, ''),
					@arb_addr_line1 = ISNULL(address.addr_line1, ''),
					@arb_addr_line2 = ISNULL(address.addr_line2, ''),
					@arb_addr_line3 = ISNULL(address.addr_line3, ''),
					@arb_addr_city = ISNULL(address.addr_city, ''),
					@arb_addr_state = ISNULL(address.addr_state, ''),
					@arb_addr_zip = ISNULL(address.addr_zip, ''),
					@arb_addr_country = RTRIM(ISNULL(address.country_cd, '')),
					@arb_addr_country_name = isnull(country.country_name, ''),
					@arb_addr_is_international = isnull(address.is_international, 0)

			FROM agent_assoc

			INNER JOIN account
			ON agent_assoc.agent_id = account.acct_id

			INNER JOIN address
			ON account.acct_id = address.acct_id
				AND address.primary_addr = 'Y'

			LEFT OUTER JOIN country with (nolock)
			ON country.country_cd = address.country_cd

			WHERE prop_id = @id1
				AND owner_tax_yr = @year
				AND owner_id = @id2
				AND ISNULL(exp_dt, getdate() + 1) > getdate()
				AND arb_mailings = 'T'

			--Get Appraiser Name
			declare @appraiser_nm as varchar(40)

			SELECT @appraiser_nm = appraiser.appraiser_nm
			FROM property_val WITH (NOLOCK) INNER JOIN appraiser WITH (NOLOCK)
				ON property_val.last_appraiser_id = appraiser.appraiser_id
			INNER JOIN prop_supp_assoc WITH (NOLOCK)
				ON property_val.prop_id = prop_supp_assoc.prop_id
				AND property_val.sup_num = prop_supp_assoc.sup_num
				AND property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr
			WHERE prop_supp_assoc.prop_id = @id1
				AND prop_supp_assoc.owner_tax_yr = @year

			--Get School Code
			declare @school_cd as varchar(5)

			select @school_cd = e.entity_cd
			from entity_prop_assoc epa with (nolock),
				entity e with (nolock),
				prop_supp_assoc psa with (nolock)
			where epa.prop_id = psa.prop_id
				and epa.sup_num = psa.sup_num
				and epa.tax_yr = psa.owner_tax_yr
				and epa.entity_id = e.entity_id
				and e.entity_type_cd = 'S'
				and psa.prop_id = @id1
				and psa.owner_tax_yr = @year

			--Get phone numbers for OWNER
			declare @owner_phone_business 	as varchar(20)
			declare @owner_phone_business2 	as varchar(20)
			declare @owner_phone_cell 	as varchar(20)
			declare @owner_phone_fax 	as varchar(20)
			declare @owner_phone_home 	as varchar(20)
			declare @owner_phone_home2 	as varchar(20)

			select @owner_phone_business  	= phone_num from phone with (nolock) where acct_id = @id2 and phone_type_cd = 'B'
			select @owner_phone_business2 	= phone_num from phone with (nolock) where acct_id = @id2 and phone_type_cd = 'B2'
			select @owner_phone_cell 	= phone_num from phone with (nolock) where acct_id = @id2 and phone_type_cd = 'C'
			select @owner_phone_fax 	= phone_num from phone with (nolock) where acct_id = @id2 and phone_type_cd = 'F'
			select @owner_phone_home 	= phone_num from phone with (nolock) where acct_id = @id2 and phone_type_cd = 'H'
			select @owner_phone_home2 	= phone_num from phone with (nolock) where acct_id = @id2 and phone_type_cd = 'H2'

			--Get phone numbers for CA_AGENT
			declare @ca_agent_phone_business  as varchar(20)
			declare @ca_agent_phone_business2 as varchar(20)
			declare @ca_agent_phone_cell 	  as varchar(20)
			declare @ca_agent_phone_fax 	  as varchar(20)
			declare @ca_agent_phone_home 	  as varchar(20)
			declare @ca_agent_phone_home2 	  as varchar(20)

			if (@ca_agent_id > 0)
			begin
				select @ca_agent_phone_business  = phone_num from phone with (nolock) where acct_id = @ca_agent_id and phone_type_cd = 'B'
				select @ca_agent_phone_business2 = phone_num from phone with (nolock) where acct_id = @ca_agent_id and phone_type_cd = 'B2'
				select @ca_agent_phone_cell 	 = phone_num from phone with (nolock) where acct_id = @ca_agent_id and phone_type_cd = 'C'
				select @ca_agent_phone_fax 	 = phone_num from phone with (nolock) where acct_id = @ca_agent_id and phone_type_cd = 'F'
				select @ca_agent_phone_home 	 = phone_num from phone with (nolock) where acct_id = @ca_agent_id and phone_type_cd = 'H'
				select @ca_agent_phone_home2 	 = phone_num from phone with (nolock) where acct_id = @ca_agent_id and phone_type_cd = 'H2'
			end

			--Get phone numbers for ENT_AGENT
			declare @ent_agent_phone_business  as varchar(20)
			declare @ent_agent_phone_business2 as varchar(20)
			declare @ent_agent_phone_cell 	   as varchar(20)
			declare @ent_agent_phone_fax 	   as varchar(20)
			declare @ent_agent_phone_home 	   as varchar(20)
			declare @ent_agent_phone_home2 	   as varchar(20)

			if (@ent_agent_id > 0)
			begin
				select @ent_agent_phone_business  = phone_num from phone with (nolock) where acct_id = @ent_agent_id and phone_type_cd = 'B'
				select @ent_agent_phone_business2 = phone_num from phone with (nolock) where acct_id = @ent_agent_id and phone_type_cd = 'B2'
				select @ent_agent_phone_cell 	  = phone_num from phone with (nolock) where acct_id = @ent_agent_id and phone_type_cd = 'C'
				select @ent_agent_phone_fax 	  = phone_num from phone with (nolock) where acct_id = @ent_agent_id and phone_type_cd = 'F'
				select @ent_agent_phone_home 	  = phone_num from phone with (nolock) where acct_id = @ent_agent_id and phone_type_cd = 'H'
				select @ent_agent_phone_home2 	  = phone_num from phone with (nolock) where acct_id = @ent_agent_id and phone_type_cd = 'H2'
			end

			--Get phone numbers for ARB_AGENT
			declare @arb_agent_phone_business  as varchar(20)
			declare @arb_agent_phone_business2 as varchar(20)
			declare @arb_agent_phone_cell 	   as varchar(20)
			declare @arb_agent_phone_fax 	   as varchar(20)
			declare @arb_agent_phone_home 	   as varchar(20)
			declare @arb_agent_phone_home2 	   as varchar(20)

			if (@arb_agent_id > 0)
			begin
				select @arb_agent_phone_business  = phone_num from phone with (nolock) where acct_id = @arb_agent_id and phone_type_cd = 'B'
				select @arb_agent_phone_business2 = phone_num from phone with (nolock) where acct_id = @arb_agent_id and phone_type_cd = 'B2'
				select @arb_agent_phone_cell 	  = phone_num from phone with (nolock) where acct_id = @arb_agent_id and phone_type_cd = 'C'
				select @arb_agent_phone_fax 	  = phone_num from phone with (nolock) where acct_id = @arb_agent_id and phone_type_cd = 'F'
				select @arb_agent_phone_home 	  = phone_num from phone with (nolock) where acct_id = @arb_agent_id and phone_type_cd = 'H'
				select @arb_agent_phone_home2 	  = phone_num from phone with (nolock) where acct_id = @arb_agent_id and phone_type_cd = 'H2'
			end


			--RETURN VALUES
			SELECT DISTINCT property.prop_id 			as PROP_ID,
					ISNULL(account.file_as_name, '') 	as OWNER_NAME,
					ISNULL(account.acct_id, '') 	 	as OWNER_ID,

					dbo.fn_Address(
						account.file_as_name, 
						address.addr_line1,
						address.addr_line2,
						address.addr_line3,
						address.addr_city,
						address.addr_state,
						address.addr_zip,
						country.country_name,
						address.is_international,
						5
					)									as NAME_ADDRESS,
					dbo.fn_Address(
						account.file_as_name, 
						address.addr_line1,
						address.addr_line2,
						address.addr_line3,
						address.addr_city,
						address.addr_state,
						address.addr_zip,
						country.country_name,
						address.is_international,
						5
					)									as NAME_ADDRESS_5LINES,
					dbo.fn_Address(
						account.file_as_name, 
						address.addr_line1,
						address.addr_line2,
						address.addr_line3,
						address.addr_city,
						address.addr_state,
						address.addr_zip,
						country.country_name,
						address.is_international,
						6
					)									as NAME_ADDRESS_6LINES,

					RTRIM(ISNULL(address.addr_line1, '')) 	as OWNER_ADDR_LINE1,
					ISNULL(address.addr_line2, '') 		as OWNER_ADDR_LINE2,
					ISNULL(address.addr_line3, '') 		as OWNER_ADDR_LINE3,
					ISNULL(address.addr_city, '') 		as OWNER_ADDR_CITY,
					ISNULL(address.addr_state, '') 		as OWNER_ADDR_STATE,
					ISNULL(address.addr_zip, '') 		as OWNER_ADDR_ZIP,
					ISNULL(address.country_cd, '') 		as OWNER_ADDR_COUNTRY,
					ISNULL(country.country_name, '')	as OWNER_ADDR_COUNTRY_NAME,
					ISNULL(address.is_international, 0) as OWNER_ADDR_IS_INTERNATIONAL,
					RTRIM(ISNULL(address.addr_city, '')) + ', ' + RTRIM(ISNULL(address.addr_state, '')) + ' ' + RTRIM(ISNULL(address.addr_zip, '')) as OWNER_ADDR_CSZ,
					ISNULL(@owner_phone_business, '') 	as OWNER_PHONE_BUSINESS,
					ISNULL(@owner_phone_business2, '') 	as OWNER_PHONE_BUSINESS2,
					ISNULL(@owner_phone_cell, '') 		as OWNER_PHONE_CELL,
					ISNULL(@owner_phone_fax, '') 		as OWNER_PHONE_FAX,
					ISNULL(@owner_phone_home, '') 		as OWNER_PHONE_HOME,
					ISNULL(@owner_phone_home2, '') 		as OWNER_PHONE_HOME2,

					ISNULL(geo_id, '') 			as GEO_ID,
					ISNULL(property.ref_id1, '')		as REF_ID1,
					ISNULL(property.ref_id2, '')		as REF_ID2,
					ISNULL(legal_desc, '') 			as LEGAL_DESC,
					LTRIM(REPLACE(isnull(situs_display, ''), CHAR(13) + CHAR(10), ' ')) as SITUS,
					ISNULL(@entities, '') 			as ENTITIES,
					ISNULL(@exemptions, '') 		as EXEMPTIONS,
					ISNULL(property.dba_name, '') 		as DBA_NAME,
					ISNULL(property_val.legal_acreage, 0) 	as LEGAL_ACREAGE,
					ISNULL(property_val.market, 0) 		as MARKET_VAL,
					ISNULL(@appraiser_nm, '') 		as APPRAISER_NM,
					ISNULL(@school_cd, '') 			as SCHOOL_CD,

					ISNULL(@ca_agent_name, '') 		as CA_AGENT_NAME,
					dbo.fn_Address(
						@ca_agent_name, 
						@ca_addr_line1,
						@ca_addr_line2,
						@ca_addr_line3,
						@ca_addr_city,
						@ca_addr_state,
						@ca_addr_zip,
						@ca_addr_country_name,
						@ca_addr_is_international,
						5
					)								as CA_AGENT_ADDRESS,
					dbo.fn_Address(
						@ca_agent_name, 
						@ca_addr_line1,
						@ca_addr_line2,
						@ca_addr_line3,
						@ca_addr_city,
						@ca_addr_state,
						@ca_addr_zip,
						@ca_addr_country_name,
						@ca_addr_is_international,
						5
					)								as CA_AGENT_ADDRESS_5LINES,
					ISNULL(@ca_addr_line1, '') 		as CA_ADDR_LINE1,
					ISNULL(@ca_addr_line2, '') 		as CA_ADDR_LINE2,
					ISNULL(@ca_addr_line3, '') 		as CA_ADDR_LINE3,
					ISNULL(@ca_addr_city, '') 		as CA_ADDR_CITY,
					ISNULL(@ca_addr_state, '') 		as CA_ADDR_STATE,
					ISNULL(@ca_addr_zip, '') 		as CA_ADDR_ZIP,
					ISNULL(@ca_addr_country, '') 		as CA_ADDR_COUNTRY,
					ISNULL(@ca_addr_country_name, '')	as CA_ADDR_COUNTRY_NAME,
					ISNULL(@ca_addr_is_international, 0)	as CA_ADDR_IS_INTERNATIONAL,
					ISNULL(@ca_addr_csz, '') 		as CA_ADDR_CSZ,
					ISNULL(@ca_agent_phone_business, '') 	as CA_AGENT_PHONE_BUSINESS,
					ISNULL(@ca_agent_phone_business2, '') 	as CA_AGENT_PHONE_BUSINESS2,
					ISNULL(@ca_agent_phone_cell, '') 	as CA_AGENT_PHONE_CELL,
					ISNULL(@ca_agent_phone_fax, '') 	as CA_AGENT_PHONE_FAX,
					ISNULL(@ca_agent_phone_home, '') 	as CA_AGENT_PHONE_HOME,
					ISNULL(@ca_agent_phone_home2, '') 	as CA_AGENT_PHONE_HOME2,

					ISNULL(@ent_agent_name, '') 		as ENT_AGENT_NAME,
					dbo.fn_Address(
						@ent_agent_name, 
						@ent_addr_line1,
						@ent_addr_line2,
						@ent_addr_line3,
						@ent_addr_city,
						@ent_addr_state,
						@ent_addr_zip,
						@ent_addr_country_name,
						@ent_addr_is_international,
						5
					)									as ENT_AGENT_ADDRESS,
					dbo.fn_Address(
						@ent_agent_name, 
						@ent_addr_line1,
						@ent_addr_line2,
						@ent_addr_line3,
						@ent_addr_city,
						@ent_addr_state,
						@ent_addr_zip,
						@ent_addr_country_name,
						@ent_addr_is_international,
						5
					)									as ENT_AGENT_ADDRESS_5LINES,
					ISNULL(@ent_addr_line1, '') 		as ENT_ADDR_LINE1,
					ISNULL(@ent_addr_line2, '') 		as ENT_ADDR_LINE2,
					ISNULL(@ent_addr_line3, '') 		as ENT_ADDR_LINE3,
					ISNULL(@ent_addr_city, '') 		as ENT_ADDR_CITY,
					ISNULL(@ent_addr_state, '') 		as ENT_ADDR_STATE,
					ISNULL(@ent_addr_zip, '') 		as ENT_ADDR_ZIP,
					ISNULL(@ent_addr_country, '') 		as ENT_ADDR_COUNTRY,
					ISNULL(@ent_addr_country_name, '')	as ENT_ADDR_COUNTRY_NAME,
					ISNULL(@ent_addr_is_international, 0)	as ENT_ADDR_IS_INTERNATIONAL,
					ISNULL(@ent_agent_phone_business, '') 	as ENT_AGENT_PHONE_BUSINESS,
					ISNULL(@ent_agent_phone_business2, '') 	as ENT_AGENT_PHONE_BUSINESS2,
					ISNULL(@ent_agent_phone_cell, '') 	as ENT_AGENT_PHONE_CELL,
					ISNULL(@ent_agent_phone_fax, '') 	as ENT_AGENT_PHONE_FAX,
					ISNULL(@ent_agent_phone_home, '') 	as ENT_AGENT_PHONE_HOME,
					ISNULL(@ent_agent_phone_home2, '') 	as ENT_AGENT_PHONE_HOME2,

					ISNULL(@arb_agent_name, '') 		as ARB_AGENT_NAME,
					dbo.fn_Address(
						@arb_agent_name, 
						@arb_addr_line1,
						@arb_addr_line2,
						@arb_addr_line3,
						@arb_addr_city,
						@arb_addr_state,
						@arb_addr_zip,
						@arb_addr_country_name,
						@arb_addr_is_international,
						5
					)									as ARB_AGENT_ADDRESS,
					dbo.fn_Address(
						@arb_agent_name, 
						@arb_addr_line1,
						@arb_addr_line2,
						@arb_addr_line3,
						@arb_addr_city,
						@arb_addr_state,
						@arb_addr_zip,
						@arb_addr_country_name,
						@arb_addr_is_international,
						5
					)									as ARB_AGENT_ADDRESS_5LINES,
					ISNULL(@arb_addr_line1, '') 		as ARB_ADDR_LINE1,
					ISNULL(@arb_addr_line2, '') 		as ARB_ADDR_LINE2,
					ISNULL(@arb_addr_line3, '') 		as ARB_ADDR_LINE3,
					ISNULL(@arb_addr_city, '') 		as ARB_ADDR_CITY,
					ISNULL(@arb_addr_state, '') 		as ARB_ADDR_STATE,
					ISNULL(@arb_addr_zip, '') 		as ARB_ADDR_ZIP,
					ISNULL(@arb_addr_country, '') 		as ARB_ADDR_COUNTRY,
					ISNULL(@arb_addr_country_name, '')	as ARB_ADDR_COUNTRY_NAME,
					ISNULL(@arb_addr_is_international, 0)	as ARB_ADDR_IS_INTERNATIONAL,
					ISNULL(@arb_agent_phone_business, '') 	as ARB_AGENT_PHONE_BUSINESS,
					ISNULL(@arb_agent_phone_business2, '') 	as ARB_AGENT_PHONE_BUSINESS2,
					ISNULL(@arb_agent_phone_cell, '') 	as ARB_AGENT_PHONE_CELL,
					ISNULL(@arb_agent_phone_fax, '') 	as ARB_AGENT_PHONE_FAX,
					ISNULL(@arb_agent_phone_home, '') 	as ARB_AGENT_PHONE_HOME,
					ISNULL(@arb_agent_phone_home2, '') 	as ARB_AGENT_PHONE_HOME2,

					CASE WHEN @ca_agent_name IS NULL THEN ISNULL(account.file_as_name, '') 	 ELSE @ca_agent_name 		END AS CA_AGENT_OR_OWNER_NAME,
					dbo.fn_Address(
						coalesce(@ca_agent_name, account.file_as_name, ''), 
						CASE 
							WHEN @ca_agent_name IS NULL THEN ISNULL(address.addr_line1, '')
							ELSE 'Agent for: ' + ISNULL(account.file_as_name, '') + char(13) + @ca_addr_line1
						END,
						CASE
							WHEN @ca_agent_name IS NULL THEN ISNULL(address.addr_line2, '')
							ELSE @ca_addr_line2
						END,
						CASE
							WHEN @ca_agent_name IS NULL THEN ISNULL(address.addr_line3, '')
							ELSE @ca_addr_line3
						END,
						CASE
							WHEN @ca_agent_name IS NULL THEN ISNULL(address.addr_city, '')
							ELSE @ca_addr_city
						END,
						CASE
							WHEN @ca_agent_name IS NULL THEN ISNULL(address.addr_state, '')
							ELSE @ca_addr_state
						END,
						CASE
							WHEN @ca_agent_name IS NULL THEN ISNULL(address.addr_zip, '')
							ELSE @ca_addr_zip
						END,
						CASE
							WHEN @ca_agent_name IS NULL THEN ISNULL(country.country_name, '')
							ELSE @ca_addr_country_name
						END,
						CASE
							WHEN @ca_agent_name IS NULL THEN ISNULL(address.is_international, '')
							ELSE @ca_addr_is_international
						END,
						6
					) as CA_AGENT_OR_OWNER_NAME_ADDRESS,
					dbo.fn_Address(
						coalesce(@ca_agent_name, account.file_as_name, ''), 
						CASE 
							WHEN @ca_agent_name IS NULL THEN ISNULL(address.addr_line1, '')
							ELSE 'Agent for: ' + ISNULL(account.file_as_name, '') + char(13) + @ca_addr_line1
						END,
						CASE
							WHEN @ca_agent_name IS NULL THEN ISNULL(address.addr_line2, '')
							ELSE @ca_addr_line2
						END,
						CASE
							WHEN @ca_agent_name IS NULL THEN ISNULL(address.addr_line3, '')
							ELSE @ca_addr_line3
						END,
						CASE
							WHEN @ca_agent_name IS NULL THEN ISNULL(address.addr_city, '')
							ELSE @ca_addr_city
						END,
						CASE
							WHEN @ca_agent_name IS NULL THEN ISNULL(address.addr_state, '')
							ELSE @ca_addr_state
						END,
						CASE
							WHEN @ca_agent_name IS NULL THEN ISNULL(address.addr_zip, '')
							ELSE @ca_addr_zip
						END,
						CASE
							WHEN @ca_agent_name IS NULL THEN ISNULL(country.country_name, '')
							ELSE @ca_addr_country_name
						END,
						CASE
							WHEN @ca_agent_name IS NULL THEN ISNULL(address.is_international, '')
							ELSE @ca_addr_is_international
						END,
						6
					) as CA_AGENT_OR_OWNER_NAME_ADDRESS_5LINES,
					CASE WHEN @ca_agent_name IS NULL THEN ISNULL(address.addr_line1, '') 	 ELSE 'Agent for: ' + ISNULL(account.file_as_name, '') + char(13) + @ca_addr_line1 END AS CA_AGENT_OR_OWNER_ADDR_LINE1,
					CASE WHEN @ca_agent_name IS NULL THEN ISNULL(address.addr_line2, '') 	 ELSE @ca_addr_line2 		END AS CA_AGENT_OR_OWNER_ADDR_LINE2,
					CASE WHEN @ca_agent_name IS NULL THEN ISNULL(address.addr_line3, '') 	 ELSE @ca_addr_line3 		END AS CA_AGENT_OR_OWNER_ADDR_LINE3,
					CASE WHEN @ca_agent_name IS NULL THEN ISNULL(address.addr_city, '') 	 ELSE @ca_addr_city 		END AS CA_AGENT_OR_OWNER_ADDR_CITY,
					CASE WHEN @ca_agent_name IS NULL THEN ISNULL(address.addr_state, '') 	 ELSE @ca_addr_state 		END AS CA_AGENT_OR_OWNER_ADDR_STATE,
					CASE WHEN @ca_agent_name IS NULL THEN ISNULL(address.addr_zip, '') 	 ELSE @ca_addr_zip 		END AS CA_AGENT_OR_OWNER_ADDR_ZIP,
					CASE WHEN @ca_agent_name IS NULL THEN ISNULL(address.country_cd, '') 	 ELSE @ca_addr_country 		END AS CA_AGENT_OR_OWNER_ADDR_COUNTRY,
					CASE WHEN @ca_agent_name IS NULL THEN ISNULL(country.country_name, '') 	 ELSE @ca_addr_country_name END AS CA_AGENT_OR_OWNER_ADDR_COUNTRY_NAME,
					CASE WHEN @ca_agent_name IS NULL THEN ISNULL(address.is_international, '') 	 ELSE @ca_addr_is_international END AS CA_AGENT_OR_OWNER_ADDR_IS_INTERNATIONAL,
					CASE WHEN @ca_agent_name IS NULL THEN ISNULL(@owner_phone_business, '')  ELSE @ca_agent_phone_business 	END AS CA_AGENT_OR_OWNER_PHONE_BUSINESS,
					CASE WHEN @ca_agent_name IS NULL THEN ISNULL(@owner_phone_business2, '') ELSE @ca_agent_phone_business2 END AS CA_AGENT_OR_OWNER_PHONE_BUSINESS2,
					CASE WHEN @ca_agent_name IS NULL THEN ISNULL(@owner_phone_cell, '') 	 ELSE @ca_agent_phone_cell 	END AS CA_AGENT_OR_OWNER_PHONE_CELL,
					CASE WHEN @ca_agent_name IS NULL THEN ISNULL(@owner_phone_fax, '') 	 ELSE @ca_agent_phone_fax 	END AS CA_AGENT_OR_OWNER_PHONE_FAX,
					CASE WHEN @ca_agent_name IS NULL THEN ISNULL(@owner_phone_home, '') 	 ELSE @ca_agent_phone_home 	END AS CA_AGENT_OR_OWNER_PHONE_HOME,
					CASE WHEN @ca_agent_name IS NULL THEN ISNULL(@owner_phone_home2, '') 	 ELSE @ca_agent_phone_home2 	END AS CA_AGENT_OR_OWNER_PHONE_HOME2

			FROM property

			INNER JOIN pacs_system
			ON pacs_system.system_type IN ('A','C')

			INNER JOIN prop_supp_assoc
			ON property.prop_id = prop_supp_assoc.prop_id
				AND prop_supp_assoc.owner_tax_yr = pacs_system.appr_yr

			INNER JOIN property_val
			ON property.prop_id = property_val.prop_id
				AND prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr
				AND prop_supp_assoc.sup_num = property_val.sup_num

			INNER JOIN owner
			ON property.prop_id = owner.prop_id
				AND prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr
				AND prop_supp_assoc.sup_num = owner.sup_num
				AND owner.owner_id = @id2

			INNER JOIN account
			ON owner.owner_id = account.acct_id

			LEFT OUTER JOIN address
			ON account.acct_id = address.acct_id

				AND address.primary_addr = 'Y'

			LEFT OUTER JOIN country with (nolock)
			ON country.country_cd = address.country_cd

			LEFT OUTER JOIN phone
			ON account.acct_id = phone.acct_id

			LEFT OUTER JOIN situs
			ON property.prop_id = situs.prop_id
				AND situs.primary_situs = 'Y'
			WHERE property.prop_id = @id1
		END
		ELSE
		BEGIN
			SELECT 'Property ID' 					as PROP_ID,
					'Owner''s Name' 			as OWNER_NAME,
					'Owner ID' 				as OWNER_ID,
					'Owner''s Name and Address' 		as NAME_ADDRESS,
					'Owner''s Name and Address (5 lines)' 	as NAME_ADDRESS_5LINES,
					'Owner''s Name and Address (6 lines-Intl)' 	as NAME_ADDRESS_6LINES,
					'Owner Addr Line 1' 			as OWNER_ADDR_LINE1,
					'Owner Addr Line 2' 			as OWNER_ADDR_LINE2,
					'Owner Addr Line 3' 			as OWNER_ADDR_LINE3,
					'Owner Addr City'   			as OWNER_ADDR_CITY,
					'Owner Addr State'  			as OWNER_ADDR_STATE,
					'Owner Addr Zip'    			as OWNER_ADDR_ZIP,
					'Owner Addr Country'			as OWNER_ADDR_COUNTRY,
					'Owner Addr Country Name'		as OWNER_ADDR_COUNTRY_NAME,
					'Owner Addr CSZ'    			as OWNER_ADDR_CSZ,
					'Owner Phone Business' 	 		as OWNER_PHONE_BUSINESS,
					'Owner Phone Business 2' 		as OWNER_PHONE_BUSINESS2,
					'Owner Phone Cell' 	 		as OWNER_PHONE_CELL,
					'Owner Phone Fax' 	 		as OWNER_PHONE_FAX,
					'Owner Phone Home' 	 		as OWNER_PHONE_HOME,
					'Owner Phone Home 2' 	 		as OWNER_PHONE_HOME2,

					'Geographic ID' 			as GEO_ID,
					'Reference ID 1'			as REF_ID1,
					'Reference ID 2'			as REF_ID2,
					'Legal Description' 			as LEGAL_DESC,
					'Situs' 				as SITUS,
					'Entities' 				as ENTITIES,
					'Exemptions' 				as EXEMPTIONS,
					'DBA - Doing Business As' 		as DBA_NAME,
					'Legal Acreage' 			as LEGAL_ACREAGE,
					'Market Value' 				as MARKET_VAL,
					'Appraiser Name' 			as APPRAISER_NM,
					'School Code' 				as SCHOOL_CD,

					'CA Agent Name' 			as CA_AGENT_NAME,
					'CA Agent Name and Address' 		as CA_AGENT_ADDRESS,
					'CA Agent Name and Address (5 lines)' 	as CA_AGENT_ADDRESS_5LINES,
					'CA Agent Name and Address (6 lines-Intl)' 	as CA_AGENT_ADDRESS_6LINES,
					'CA Addr Line 1' 			as CA_ADDR_LINE1,
					'CA Addr Line 2'			as CA_ADDR_LINE2,
					'CA Addr Line 3'			as CA_ADDR_LINE3,
					'CA Addr City'				as CA_ADDR_CITY,
					'CA Addr State'				as CA_ADDR_STATE,
					'CA Addr Zip'				as CA_ADDR_ZIP,
					'CA Addr Country'			as CA_ADDR_COUNTRY,
					'CA Addr Country Name'		as CA_ADDR_COUNTRY_NAME,
					'CA Addr CSZ'    			as CA_ADDR_CSZ,
					'CA Agent Phone Business' 		as CA_AGENT_PHONE_BUSINESS,
					'CA Agent Phone Business 2' 		as CA_AGENT_PHONE_BUSINESS2,
					'CA Agent Phone Cell' 			as CA_AGENT_PHONE_CELL,
					'CA Agent Phone Fax' 			as CA_AGENT_PHONE_FAX,
					'CA Agent Phone Home' 			as CA_AGENT_PHONE_HOME,
					'CA Agent Phone Home 2' 		as CA_AGENT_PHONE_HOME2,

					'ENT Agent Name' 			as ENT_AGENT_NAME,
					'ENT Agent Name and Address' 		as ENT_AGENT_ADDRESS,
					'ENT Agent Name and Address (5 lines)' 	as ENT_AGENT_ADDRESS_5LINES,
					'ENT Agent Name and Address (6 lines-Intl)' 	as ENT_AGENT_ADDRESS_6LINES,
					'ENT Agent Phone Business' 		as ENT_AGENT_PHONE_BUSINESS,
					'ENT Agent Phone Business 2' 		as ENT_AGENT_PHONE_BUSINESS2,
					'ENT Agent Phone Cell' 			as ENT_AGENT_PHONE_CELL,
					'ENT Agent Phone Fax' 			as ENT_AGENT_PHONE_FAX,
					'ENT Agent Phone Home' 			as ENT_AGENT_PHONE_HOME,
					'ENT Agent Phone Home 2' 		as ENT_AGENT_PHONE_HOME2,

					'ARB Agent Name' 			as ARB_AGENT_NAME,
					'ARB Agent Name and Address' 		as ARB_AGENT_ADDRESS,
					'ARB Agent Name and Address (5 lines)' 	as ARB_AGENT_ADDRESS_5LINES,
					'ARB Agent Name and Address (6 lines-Intl)' 	as ARB_AGENT_ADDRESS_6LINES,
					'ARB Agent Phone Business' 		as ARB_AGENT_PHONE_BUSINESS,
					'ARB Agent Phone Business 2' 		as ARB_AGENT_PHONE_BUSINESS2,
					'ARB Agent Phone Cell' 			as ARB_AGENT_PHONE_CELL,
					'ARB Agent Phone Fax' 			as ARB_AGENT_PHONE_FAX,
					'ARB Agent Phone Home' 			as ARB_AGENT_PHONE_HOME,
					'ARB Agent Phone Home 2' 		as ARB_AGENT_PHONE_HOME2,

					'CA Agent or Owner Name and Address' 	as CA_AGENT_OR_OWNER_NAME_ADDRESS_5LINES,
					'CA Agent or Owner Phone Business' 	as CA_AGENT_OR_OWNER_PHONE_BUSINESS,
					'CA Agent or Owner Phone Business 2' 	as CA_AGENT_OR_OWNER_PHONE_BUSINESS2,
					'CA Agent or Owner Phone Cell' 		as CA_AGENT_OR_OWNER_PHONE_CELL,
					'CA Agent or Owner Phone Fax' 		as CA_AGENT_OR_OWNER_PHONE_FAX,
					'CA Agent or Owner Phone Home' 		as CA_AGENT_OR_OWNER_PHONE_HOME,
					'CA Agent or Owner Phone Home 2' 	as CA_AGENT_OR_OWNER_PHONE_HOME2
		END
	END
	ELSE
	BEGIN
		IF @id1 <> 0
		BEGIN
			SELECT account.acct_id 				as ACCOUNT_ID,
					account.file_as_name 		as ACCOUNT_NAME,
					account.first_name 		as FIRST_NAME,
					account.last_name 		as LAST_NAME,
					dbo.fn_Address(
						account.file_as_name,
						address.addr_line1,
						address.addr_line2,
						address.addr_line3,
						address.addr_city,
						address.addr_state,
						address.addr_zip,
						country.country_name,
						address.is_international,
						5
					)								as NAME_ADDRESS,
					dbo.fn_Address(
						account.file_as_name,
						address.addr_line1,
						address.addr_line2,
						address.addr_line3,
						address.addr_city,
						address.addr_state,
						address.addr_zip,
						country.country_name,
						address.is_international,
						5
					)								as NAME_ADDRESS_5LINES,
					dbo.fn_Address(
						account.file_as_name,
						address.addr_line1,
						address.addr_line2,
						address.addr_line3,
						address.addr_city,
						address.addr_state,
						address.addr_zip,
						country.country_name,
						address.is_international,
						6
					)								as NAME_ADDRESS_6LINES,
					ISNULL(address.addr_line1, '') 	as ADDR_LINE1,
					ISNULL(address.addr_line2, '') 	as ADDR_LINE2,
					ISNULL(address.addr_line3, '') 	as ADDR_LINE3,
					ISNULL(address.addr_city, '') 	as ADDR_CITY,
					ISNULL(address.addr_state, '') 	as ADDR_STATE,
					ISNULL(address.addr_zip, '') 	as ADDR_ZIP,
					ISNULL(address.country_cd, '') 	as ADDR_COUNTRY,
					ISNULL(country.country_name, '') as ADDR_COUNTRY_NAME,
					ISNULL(address.is_international, 0) as ADDR_IS_INTERNATIONAL,
					ISNULL(phone.phone_num, '') 	as PHONE_NUMBER,
					ISNULL(account.email_addr, '') 	as EMAIL,
					ISNULL(account.comment, '') 	as COMMENT
			FROM account
			LEFT OUTER JOIN address
			ON account.acct_id = address.acct_id
				AND address.primary_addr = 'Y'

			LEFT OUTER JOIN country with (nolock)
			ON country.country_cd = address. country_cd

			LEFT OUTER JOIN phone
			ON account.acct_id = phone.acct_id
				AND phone.phone_type_cd = 'B'

			WHERE account.acct_id = @id1
		END

		ELSE
		BEGIN
			SELECT 'Account ID' 					as ACCOUNT_ID,
					'Account Name' 				as ACCOUNT_NAME,
					'First Name' 				as FIRST_NAME,
					'Last Name' 				as LAST_NAME,
					'Account''s Name and Address' 		as NAME_ADDRESS,
					'Account''s Name and Address (5 lines)' as NAME_ADDRESS_5LINES,
					'Account''s Name and Address (6 lines-Intl)' as NAME_ADDRESS_6LINES,
					'Phone Number' 				as PHONE_NUMBER,
					'Email Address' 			as EMAIL,
					'Comment' 				as COMMENT
		END
	END

GO

