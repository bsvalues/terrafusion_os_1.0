


CREATE PROCEDURE SalesRatioReportProfileBuildCriteria

	@input_detail_id	int,
	@input_user_id		int

AS

declare @run_type 	varchar(5)
declare @run_id		int
declare @run_code	varchar(20)
declare	@appr_year	int
declare @search_by	varchar(255)
declare @criteria	varchar(255)
declare @space8		varchar(8)
declare	@line_order	int
declare @option_code	varchar(20)
declare @option_desc	varchar(255)
declare @bNeedBlank	bit

SET NOCOUNT ON


	SET @space8 = '        '

	/* Start at 1 because PACS inserts the Profile one at 0. */

	SET @line_order = 1
	SET @bNeedBlank = 0


	SELECT @appr_year = appr_yr
	FROM pacs_system
	WHERE system_type IN ('A','B')

	SELECT @run_type = run_type,
			@run_id = run_id,
			@run_code = CASE WHEN run_type = 'AS' THEN abs_subdv_cd
							WHEN run_type = 'N' OR run_type = 'QN' THEN hood_cd
							WHEN run_type = 'R' THEN region
							WHEN run_type = 'S' THEN subset
						END
	FROM profile_run_list
	WITH (NOLOCK)
	WHERE detail_id = @input_detail_id


	/*
	 * First insert a blank line, then the main criteria 
	 * being the code used to create the profile.
	 */

	INSERT INTO sales_ratio_report_criteria
	(pacs_user_id, line_order, criteria)
	VALUES
	(@input_user_id, @line_order, '')

	SET @line_order = @line_order + 1

	IF @run_type = 'AS'
	BEGIN
		SELECT @criteria = LEFT(abs_subdv_desc, 255)
		FROM abs_subdv
		WITH (NOLOCK)
		WHERE abs_subdv_cd = @run_code
		AND abs_subdv_yr = @appr_year

		SET @search_by = 'Search by Abstract/Subdivision'
	END

	IF @run_type = 'N' OR @run_type = 'QN'
	BEGIN
		SELECT @criteria = LEFT(hood_name, 255)
		FROM neighborhood
		WITH (NOLOCK)
		WHERE hood_cd = @run_code
		AND hood_yr = @appr_year

		SET @search_by = 'Search by Neighborhood'
	END

	IF @run_type = 'R'
	BEGIN
		SELECT @criteria = LEFT(rgn_name, 255)
		FROM region
		WITH (NOLOCK)
		WHERE rgn_cd = @run_code

		SET @search_by = 'Search by Region'
	END

	IF @run_type = 'S'
	BEGIN
		SELECT @criteria = LEFT(subset_desc, 255)
		FROM subset
		WITH (NOLOCK)
		WHERE subset_code = @run_code

		SET @search_by = 'Search by Subset'
	END

	IF @search_by <> ''
	BEGIN
		INSERT INTO sales_ratio_report_criteria
		(pacs_user_id, line_order, criteria)
		VALUES
		(@input_user_id, @line_order, @search_by)

		SET @line_order = @line_order + 1

		SET @criteria = @space8 + @run_code + ' (' + @criteria + ')'

		INSERT INTO sales_ratio_report_criteria
		(pacs_user_id, line_order, criteria)
		VALUES
		(@input_user_id, @line_order, @criteria)

		SET @line_order = @line_order + 1

		INSERT INTO sales_ratio_report_criteria
		(pacs_user_id, line_order, criteria)
		VALUES
		(@input_user_id, @line_order, '')

		SET @line_order = @line_order + 1
	END


	/*
	 * Next do Sale Date range
	 */

	SET @criteria = ''
	SELECT @criteria = ISNULL(option_desc,'')
	FROM profile_run_list_options
	WHERE option_type = 'BD'
	AND run_id = @run_id

	IF @criteria <> ''
	BEGIN
		INSERT INTO sales_ratio_report_criteria
		(pacs_user_id, line_order, criteria)
		VALUES
		(@input_user_id, @line_order, 'Search by Sale Date')

		SET @line_order = @line_order + 1

		INSERT INTO sales_ratio_report_criteria
		(pacs_user_id, line_order, criteria)
		VALUES
		(@input_user_id, @line_order, @space8 + 'From: ' + @criteria)

		SET @line_order = @line_order + 1

		SET @criteria = ''
		SELECT @criteria = ISNULL(option_desc,'')
		FROM profile_run_list_options
		WHERE option_type = 'ED'
		AND run_id = @run_id

		INSERT INTO sales_ratio_report_criteria
		(pacs_user_id, line_order, criteria)
		VALUES
		(@input_user_id, @line_order, @space8 + 'To: ' + @criteria)

		SET @line_order = @line_order + 1

		INSERT INTO sales_ratio_report_criteria
		(pacs_user_id, line_order, criteria)
		VALUES
		(@input_user_id, @line_order, '')

		SET @line_order = @line_order + 1
	END


	/*
	 * Next do School Codes
	 */

	DECLARE SCHOOL_CURSOR CURSOR FAST_FORWARD
	FOR SELECT RTRIM(entity_cd), file_as_name
		FROM profile_run_list_options AS prlo
		INNER JOIN entity AS e
		WITH (NOLOCK)
		ON prlo.option_id = e.entity_id
		INNER JOIN account AS a
		WITH (NOLOCK)
		ON prlo.option_id = a.acct_id
		WHERE prlo.option_type = 'SH'
		AND run_id = @run_id

	OPEN SCHOOL_CURSOR

	FETCH NEXT FROM SCHOOL_CURSOR INTO @option_code, @option_desc

	IF @@FETCH_STATUS = 0
	BEGIN
		INSERT INTO sales_ratio_report_criteria
		(pacs_user_id, line_order, criteria)
		VALUES
		(@input_user_id, @line_order, 'Search by School Code')

		SET @line_order = @line_order + 1

		SET @bNeedBlank = 1
	END

	WHILE @@FETCH_STATUS = 0
	BEGIN
		INSERT INTO sales_ratio_report_criteria
		(pacs_user_id, line_order, criteria)
		VALUES
		(@input_user_id, @line_order, @space8 + @option_code + ' (' + @option_desc + ')')

		SET @line_order = @line_order + 1

		FETCH NEXT FROM SCHOOL_CURSOR INTO @option_code, @option_desc
	END

	IF @bNeedBlank = 1
	BEGIN
		INSERT INTO sales_ratio_report_criteria
		(pacs_user_id, line_order, criteria)
		VALUES
		(@input_user_id, @line_order, '')

		SET @line_order = @line_order + 1

		SET @bNeedBlank = 0
	END

	CLOSE SCHOOL_CURSOR
	DEALLOCATE SCHOOL_CURSOR


	/*
	 * Next do State Codes
	 */

	DECLARE STATE_CURSOR CURSOR FAST_FORWARD
	FOR SELECT option_desc, sc.state_cd_desc
		FROM profile_run_list_options AS prlo
		INNER JOIN state_code AS sc
		WITH (NOLOCK)
		ON prlo.option_desc = sc.state_cd
		WHERE prlo.option_type = 'SC'
		AND run_id = @run_id

	OPEN STATE_CURSOR

	FETCH NEXT FROM STATE_CURSOR INTO @option_code, @option_desc

	IF @@FETCH_STATUS = 0
	BEGIN
		INSERT INTO sales_ratio_report_criteria
		(pacs_user_id, line_order, criteria)
		VALUES
		(@input_user_id, @line_order, 'Search by State Code')

		SET @line_order = @line_order + 1

		SET @bNeedBlank = 1
	END

	WHILE @@FETCH_STATUS = 0
	BEGIN
		INSERT INTO sales_ratio_report_criteria
		(pacs_user_id, line_order, criteria)
		VALUES
		(@input_user_id, @line_order, @space8 + @option_code + ' (' + @option_desc + ')')

		SET @line_order = @line_order + 1

		FETCH NEXT FROM STATE_CURSOR INTO @option_code, @option_desc
	END

	IF @bNeedBlank = 1
	BEGIN
		INSERT INTO sales_ratio_report_criteria
		(pacs_user_id, line_order, criteria)
		VALUES
		(@input_user_id, @line_order, '')

		SET @line_order = @line_order + 1

		SET @bNeedBlank = 0
	END

	CLOSE STATE_CURSOR
	DEALLOCATE STATE_CURSOR


	/*
	 * Lastly do Sale Types
	 */

	DECLARE SALE_TYPE_CURSOR CURSOR FAST_FORWARD
	FOR SELECT option_desc, st.sl_type_desc
		FROM profile_run_list_options AS prlo
		INNER JOIN sale_type AS st
		WITH (NOLOCK)
		ON prlo.option_desc = st.sl_type_cd
		WHERE prlo.option_type = 'ST'
		AND run_id = @run_id

	OPEN SALE_TYPE_CURSOR

	FETCH NEXT FROM SALE_TYPE_CURSOR INTO @option_code, @option_desc

	IF @@FETCH_STATUS = 0
	BEGIN
		INSERT INTO sales_ratio_report_criteria
		(pacs_user_id, line_order, criteria)
		VALUES
		(@input_user_id, @line_order, 'Search by Sale Type')

		SET @line_order = @line_order + 1

		SET @bNeedBlank = 1
	END

	WHILE @@FETCH_STATUS = 0
	BEGIN
		INSERT INTO sales_ratio_report_criteria
		(pacs_user_id, line_order, criteria)
		VALUES
		(@input_user_id, @line_order, @space8 + @option_code + ' (' + @option_desc + ')')

		SET @line_order = @line_order + 1

		FETCH NEXT FROM SALE_TYPE_CURSOR INTO @option_code, @option_desc
	END

	IF @bNeedBlank = 1
	BEGIN
		INSERT INTO sales_ratio_report_criteria
		(pacs_user_id, line_order, criteria)
		VALUES
		(@input_user_id, @line_order, '')

		SET @line_order = @line_order + 1

		SET @bNeedBlank = 0
	END

	CLOSE SALE_TYPE_CURSOR
	DEALLOCATE SALE_TYPE_CURSOR

GO

