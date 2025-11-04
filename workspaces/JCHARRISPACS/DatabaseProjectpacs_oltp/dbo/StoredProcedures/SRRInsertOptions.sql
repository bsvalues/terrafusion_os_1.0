------------------------------------------------------------------------------------------
-- Purpose: Generate new td_srr_options.ID and prepare following tables for Roll Report:
--   td_srr_options, td_srr_tax_area_assoc, td_srr_prop_assoc, td_srr_*_total.
-- Input data: td_sup_group_tax_area_summary (filled in SupGroupPreprocess).
------------------------------------------------------------------------------------------

--
CREATE PROCEDURE SRRInsertOptions
	
	@sup_group_id INT,
	@tax_area_ids VARCHAR(4096),   -- comma-separated list '1,4,7', empty = ALL
	@tax_area_numbers VARCHAR(4096),	-- comma-separated list '001,004,007'
	@pacs_user_id INT,
	
	@sort_order VARCHAR(50),      -- 
	@year INT,	                  -- -1 = ALL
	@begin_page INT,
	@end_page INT,
	@include_property_list BIT,   -- 
	@group_by_action BIT,         -- really should be called "sort by Action first"?
	@totals_pages_only BIT,
	@grand_totals_only BIT,
	@display_tax_areas BIT = 0
	
AS

------------------------

DECLARE 
	@option_id INT,
	@sql VARCHAR(max),
	@order_by VARCHAR(100),
	@status_cd varchar(5)

set nocount on

BEGIN TRY
	BEGIN TRANSACTION

		/* ------------------------------------- */
		/* Checking if report data exists        */
		/* If they don't exists, create them     */
		/* ------------------------------------- */
		SELECT 
			@status_cd = status_cd 
		FROM 
			sup_group 
		WHERE 
			sup_group_id = @sup_group_id
		
		IF (rtrim(@status_cd) not in ('A', 'BC')) OR 
			not exists 
			(
				SELECT 
					TOP 1 prop_id 
				FROM 
					td_sup_group_property_info WITH (NOLOCK)
				WHERE 
					sup_group_id = @sup_group_id
			)
		BEGIN
		
			/*
			 * NO!  Do not Accept a supplement group when printing the supplement roll report.
			 *
			exec WAAcceptSuppGroup @sup_group_id, @pacs_user_id
			 */

			/*
			 * Check if properties have not been recalculated.  If properties have not
			 * been recalculated, the report will not be accurate.
			 */

			if 
				exists (
					select top 1 pv.prop_val_yr
					from sup_group as sg with(nolock)
					join supplement as s with(nolock) on
						s.sup_group_id = sg.sup_group_id
					join prop_supp_assoc as psa with(nolock) on
						psa.owner_tax_yr = s.sup_tax_yr and
						psa.sup_num = s.sup_num
					join property_val as pv with(nolock) on
						pv.prop_val_yr = psa.owner_tax_yr and
						pv.sup_num = psa.sup_num and
						pv.prop_id = psa.prop_id
					where
						sg.sup_group_id = @sup_group_id and
						pv.recalc_dt is null and
						(pv.prop_inactive_dt is null or pv.udi_parent = 'T') and -- Deleted properties need not (and cannot) be recalculated
						pv.accept_create_id is null
				)
			begin
				raiserror('One or more properties have not been recalculated', 18, 1)
				return(-1)
			end

			exec SupGroupPreprocess @sup_group_id, @pacs_user_id
		END


		/* ---------------------------------- */
		/* Validate input parameters          */
		/* ---------------------------------- */
		--@tax_area_ids VARCHAR(max),

		SET @sort_order =RTRIM(LTRIM( ISNULL(@sort_order, '')))

		SET @year = ISNULL(@year, -1)
		
		IF (@begin_page <= 0)
		BEGIN
			SET @begin_page = NULL
		END

		IF (@end_page <= 0)
		BEGIN
			SET @end_page = NULL
		END

		SET @tax_area_ids = replace(isnull(@tax_area_ids, ''), ' ', '')
		IF @tax_area_ids = 'All'
		BEGIN
			SET @tax_area_ids = ''
		END
		

		/* ---------------------------------- */
		/* Get next unique 'option_id'        */
		/* ---------------------------------- */
		exec GetUniqueID 'td_srr_options', @option_id output


		/* ---------------------------------- */
		/* Populate td_srr_options table      */
		/* ---------------------------------- */
		INSERT td_srr_options
			(option_id, pacs_user_id, sup_group_id, create_dt, lock_dt, accept_dt, bill_create_dt, sort_order, 
			tax_code_areas, year, group_by_action, sub_total_pages, begin_page, end_page, run_dt,
			grand_totals_only, include_property_list, display_tax_areas)
		SELECT 
			@option_id, @pacs_user_id, @sup_group_id, sg.sup_create_dt, sg.sup_arb_ready_dt, sg.sup_accept_dt, 
			sg.sup_bill_create_dt, @sort_order, @tax_area_numbers, 
			CASE WHEN @year <= 0 THEN NULL ELSE @year END, 
			@group_by_action, @totals_pages_only, 
			@begin_page, @end_page, getdate(), @grand_totals_only, @include_property_list,
			@display_tax_areas
		FROM 
			sup_group AS sg WITH (NOLOCK)
		WHERE 
			sg.sup_group_id = @sup_group_id
		

		/* --------------------------------------- */
		/* Populate td_srr_tax_area_assoc table    */
		/* --------------------------------------- */
		INSERT td_srr_tax_area_assoc 
			(option_id, tax_area_id)
		SELECT DISTINCT 
			@option_id, tax_area_id
		FROM 
			td_sup_group_tax_area_summary AS tdsgtas WITH (NOLOCK)
		WHERE 
			tdsgtas.sup_group_id = @sup_group_id AND 
			(@tax_area_ids = '' OR 
				charindex(',' + convert(varchar, tax_area_id) + ',', ',' + @tax_area_ids + ',') > 0)


		/* --------------------------------------- */
		/* Populate td_srr_prop_assoc table        */
		/* --------------------------------------- */
		SELECT @order_by = 
			'tdsgpi.sup_yr,' 
			+ 
			(CASE WHEN @group_by_action = 1 THEN 'tdsgpi.sup_action,' ELSE '' END)
			+ 
			(CASE 
				WHEN (@sort_order = 'Geo ID') THEN 'tdsgpi.geo_id,'
				WHEN (@sort_order = 'Owner ID') THEN 'tdsgpi.owner_id,'
				WHEN (@sort_order = 'Owner Name') THEN 'tdsgpi.file_as_name,'
				WHEN (@sort_order = 'Zip Code') THEN 'addr.zip,'
			ELSE ''
			END)
			+ 
			'tdsgpi.prop_id'

		SET @sql = 
			'
				INSERT td_srr_prop_assoc 
					(option_id, pacs_user_id, sup_group_id, sup_yr, prop_id)

				SELECT 
			' 
			+ 
			convert(varchar, @option_id) 
			+ 
			', ' 
			+ 
			convert(varchar, @pacs_user_id) 
			+ 
			', ' 
			+ 
			convert(varchar, @sup_group_id) 
			+ 
			', sup_yr, prop_id ' 
			+
			'
				FROM 
					td_sup_group_property_info AS tdsgpi WITH (NOLOCK) 
				LEFT JOIN address addr ON addr.addr_type_cd = ''M'' AND addr.acct_id = tdsgpi.owner_id
				WHERE 
					tdsgpi.sup_group_id = 
			' 
			+ 
			convert(varchar, @sup_group_id) 
			+ 
			'
				AND 
				tdsgpi.prop_id IN 
					(SELECT tdsgtas.prop_id FROM td_sup_group_tax_area_summary AS tdsgtas WITH (NOLOCK) 
						WHERE tdsgtas.sup_group_id = tdsgpi.sup_group_id 
			'
			+ 
			CASE WHEN @tax_area_ids <> '' THEN ' AND tdsgtas.tax_area_id IN (' + @tax_area_ids + ') ' ELSE '' END 
			+ 
			'
				AND tdsgpi.data_flag = 0)
			' 
			+ 
			CASE WHEN @year > 0 THEN ' AND tdsgpi.sup_yr = ' +	convert(varchar, @year) ELSE '' END 
			+ 
			'
				ORDER BY 
			' 
			+ @order_by

		--print @sql
		exec (@sql)


		/* ------------------------------------------- */
		/* Populate td_srr_tax_area_grand_total table  */
		/* ------------------------------------------- */
		INSERT td_srr_year_grand_total (
			option_id, sup_group_id, sup_action, 
			pacs_user_id,sup_yr, prop_count, 
			curr_market, curr_taxable, curr_tax, 
			prev_market, prev_taxable, prev_tax, 
			gl_market, gl_taxable, gl_tax
		)
		SELECT 
			@option_id, tsgtas.sup_group_id, tsgtas.sup_action, 
			@pacs_user_id, tsgtas.sup_yr, 
			sum(tsgtas.prop_count), sum(isnull(tsgtas.curr_market, 0)), sum(isnull(tsgtas.curr_taxable, 0)), 
			sum(isnull(tsgtas.curr_tax, 0)), sum(isnull(tsgtas.prev_market, 0)), sum(isnull(tsgtas.prev_taxable, 0)), 
			sum(isnull(tsgtas.prev_tax, 0)), sum(isnull(tsgtas.gl_market, 0)), sum(isnull(tsgtas.gl_taxable, 0)), 
			sum(isnull(tsgtas.gl_tax, 0)) 
		FROM td_sup_group_tax_area_subtotal AS tsgtas 
		WITH (NOLOCK)
		join td_srr_tax_area_assoc as tstaa
		with (nolock)
		on tsgtas.tax_area_id = tstaa.tax_area_id
		and tstaa.option_id = @option_id
		WHERE 
			tsgtas.sup_group_id = @sup_group_id
		GROUP BY 
			tsgtas.sup_group_id, tsgtas.sup_action, tsgtas.sup_yr

	SELECT @option_id

	COMMIT TRANSACTION
END TRY
BEGIN CATCH
	DECLARE 
		@ErrorMessage NVARCHAR(4000),
		@ErrorSeverity INT,
		@ErrorState INT

	SELECT	
		@ErrorMessage = ERROR_MESSAGE(),
		@ErrorSeverity = ERROR_SEVERITY(),
		@ErrorState = ERROR_STATE();

	set nocount on
/*
	PRINT
		('Error message: ' + convert(nvarchar(4000), ERROR_MESSAGE()) + 
		' Error severity: ' + convert(varchar, @ErrorSeverity) + 
		' Error state ' + convert(varchar, @ErrorState))
*/	
	ROLLBACK TRANSACTION;

--	SELECT -1

	RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH

set nocount off

GO

