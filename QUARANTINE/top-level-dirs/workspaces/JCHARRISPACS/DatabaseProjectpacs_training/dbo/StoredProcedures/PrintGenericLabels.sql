

CREATE PROCEDURE PrintGenericLabels

	@input_type			varchar(10),
	@input_label_type	varchar(50),
	@input_id			int

AS

declare @appr_yr int
declare @addr_line1 varchar(60)
declare @addr_line2 varchar(60)
declare @addr_line3 varchar(60)
declare @addr_city varchar(50)
declare @addr_state varchar(50)
declare @addr_zip varchar(50)
declare @addr_country varchar(5)
-- Jeremy Wilson 34585 changes
-- International addresses have a new format
-- the country name must appear on the last line of the address by itself
declare @addr_is_international bit
declare @addr_country_name varchar(50)
declare @name varchar(70)


	SELECT @appr_yr = appr_yr
	FROM pacs_system
	WHERE system_type IN ('A', 'B')

	IF @input_type = 'Property'
	BEGIN
		IF @input_label_type = 'Geo ID/Legal Info'
		BEGIN
			SELECT TOP 1 RTRIM(p.prop_type_cd) + '-' + CONVERT(varchar(10), pv.prop_id),
						ISNULL(p.geo_id,''),
						a.file_as_name,
						'',
						pv.legal_desc
			FROM property_val AS pv
			WITH (NOLOCK)

			INNER JOIN prop_supp_assoc AS psa
			WITH (NOLOCK)
			ON pv.prop_id = psa.prop_id
			AND pv.prop_val_yr = psa.owner_tax_yr
			AND pv.sup_num = psa.sup_num

			INNER JOIN property AS p
			WITH (NOLOCK)
			ON pv.prop_id = p.prop_id

			INNER JOIN owner AS o
			WITH (NOLOCK)
			ON pv.prop_id = o.prop_id
			AND pv.prop_val_yr = o.owner_tax_yr
			AND pv.sup_num = o.sup_num

			INNER JOIN account AS a
			WITH (NOLOCK)
			ON o.owner_id = a.acct_id

			WHERE pv.prop_val_yr = @appr_yr
			AND pv.prop_id = @input_id
		END
		ELSE IF @input_label_type = 'Address'
		BEGIN
			SELECT TOP 1 @name = a.file_as_name, 
						@addr_line1 = ISNULL(ad.addr_line1,''),
						@addr_line2 = ISNULL(ad.addr_line2,''),
						@addr_line3 = ISNULL(ad.addr_line3,''),
						@addr_city = ISNULL(ad.addr_city,''),
						@addr_state = ISNULL(ad.addr_state,''),
						@addr_zip = ISNULL(ad.addr_zip,''),
						@addr_country = ISNULL(ad.country_cd,''),
						@addr_is_international = ISNULL(ad.is_international, 0),
						@addr_country_name = ISNULL(country.country_name, '')
			FROM owner AS o
			WITH (NOLOCK)

			INNER JOIN prop_supp_assoc AS psa
			WITH (NOLOCK)
			ON o.prop_id = psa.prop_id
			AND o.owner_tax_yr = psa.owner_tax_yr
			AND o.sup_num = psa.sup_num

			INNER JOIN account AS a
			WITH (NOLOCK)
			ON o.owner_id = a.acct_id

			INNER JOIN address AS ad
			WITH (NOLOCK)
			ON o.owner_id = ad.acct_id
			AND ad.primary_addr = 'Y'

			LEFT OUTER JOIN country
			WITH (NOLOCK)
			ON country.country_cd = ad.country_cd

			WHERE o.owner_tax_yr = @appr_yr
			AND o.prop_id = @input_id

			IF ISNULL(@addr_line1, '') = ''
			BEGIN
				SET @addr_line1 = @addr_line2
				SET @addr_line2 = @addr_line3
				SET @addr_line3 = ''
			END

			IF ISNULL(@addr_line1, '') = ''
			BEGIN
				SET @addr_line1 = @addr_line2
				SET @addr_line2 = @addr_line3
				SET @addr_line3 = ''
			END

			SELECT @name,
					@addr_line1,
					@addr_line2,
					@addr_line3,
					CASE WHEN @addr_is_international = 0
					THEN
						CASE WHEN @addr_city <> ''
						THEN 
							@addr_city + ', ' + @addr_state + ' ' + @addr_zip 
						ELSE 
							@addr_state + ' ' + @addr_zip  
						END
					ELSE
						@addr_city
					END,
					CASE WHEN @addr_is_international <> 0
					THEN
						@addr_country_name
					ELSE
						NULL
					END
		END
	END
	ELSE IF @input_type = 'Account'
	BEGIN
		SELECT TOP 1 @name = a.file_as_name, 
					@addr_line1 = ISNULL(ad.addr_line1,''),
					@addr_line2 = ISNULL(ad.addr_line2,''),
					@addr_line3 = ISNULL(ad.addr_line3,''),
					@addr_city = ISNULL(ad.addr_city,''),
					@addr_state = ISNULL(ad.addr_state,''),
					@addr_zip = ISNULL(ad.addr_zip,''),
					@addr_country = ISNULL(ad.country_cd,''),
					@addr_country_name = ISNULL(country.country_name, ''),
					@addr_is_international = ISNULL(ad.is_international, 0)
		FROM account AS a
		WITH (NOLOCK)

		INNER JOIN address AS ad
		WITH (NOLOCK)
		ON a.acct_id = ad.acct_id
		AND ad.primary_addr = 'Y'

		LEFT OUTER JOIN country
		WITH (NOLOCK)
		ON country.country_cd = ad.country_cd

		WHERE a.acct_id = @input_id

		IF ISNULL(@addr_line1, '') = ''
		BEGIN
			SET @addr_line1 = @addr_line2
			SET @addr_line2 = @addr_line3
			SET @addr_line3 = ''
		END

		IF ISNULL(@addr_line1, '') = ''
		BEGIN
			SET @addr_line1 = @addr_line2
			SET @addr_line2 = @addr_line3
			SET @addr_line3 = ''
		END

		SELECT @name,
				@addr_line1,
				@addr_line2,
				@addr_line3,
				CASE WHEN @addr_is_international = 0
				THEN
					CASE WHEN @addr_city <> ''
					THEN 
						@addr_city + ', ' + @addr_state + ' ' + @addr_zip 
					ELSE 
						@addr_state + ' ' + @addr_zip  
					END
				ELSE
					@addr_city
				END,
				CASE WHEN @addr_is_international <> 0
				THEN
					@addr_country_name
				ELSE
					NULL
				END				
	END

GO

