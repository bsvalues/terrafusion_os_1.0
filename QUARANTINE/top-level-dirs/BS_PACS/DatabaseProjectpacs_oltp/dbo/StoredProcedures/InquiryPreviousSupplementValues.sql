
CREATE PROCEDURE [dbo].[InquiryPreviousSupplementValues]

	@case_id int,
	@ID1 int,
	@ID2 int = NULL
as

IF @case_id > 0
BEGIN
	DECLARE @prop_val_yr int

	if @ID2 is NULL 
		set @prop_val_yr = @ID1
	else
	begin
		set @prop_val_yr = @ID2
	end


	declare @prop_id int

	SELECT @prop_id = prop_id
	FROM _arb_inquiry as ai WITH (NOLOCK)
	WHERE ai.case_id = @case_id
		AND ai.prop_val_yr = @prop_val_yr
	

	-- Select all the values for the recordset to be returned
	SELECT TOP 1 
		@case_id			as case_id,
		@prop_id			as prop_id,
		@prop_val_yr		as prop_val_yr,

		-- wpv.appraised_classified as appraised_classified_before, 
		LEFT(CONVERT(varchar(20), CONVERT(money, wpv.appraised_classified), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, wpv.appraised_classified), 1), 1) - 1) 
			as appraised_classified_before,

		-- wpv.appraised_non_classified as appraised_non_classified_before,
		LEFT(CONVERT(varchar(20), CONVERT(money, wpv.appraised_non_classified), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, wpv.appraised_non_classified), 1), 1) - 1) 
			as appraised_non_classified_before,

		-- pv.land_hstd_val as land_hstd_val_before,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.land_hstd_val), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.land_hstd_val), 1), 1) - 1) 
			as land_hstd_val_before,

		-- pv.land_non_hstd_val as land_non_hstd_val_before,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.land_non_hstd_val), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.land_non_hstd_val), 1), 1) - 1) 
			as land_non_hstd_val_before,

		-- pv.imprv_hstd_val as imprv_hstd_val_before,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.imprv_hstd_val), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.imprv_hstd_val), 1), 1) - 1) 
			as imprv_hstd_val_before,

		-- pv.imprv_non_hstd_val as imprv_non_hstd_val_before,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.imprv_non_hstd_val), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.imprv_non_hstd_val), 1), 1) - 1) 
			as imprv_non_hstd_val_before,

		-- pv.ag_hs_mkt_val as ag_hs_mkt_val_before,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.ag_hs_mkt_val), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.ag_hs_mkt_val), 1), 1) - 1) 
			as ag_hs_mkt_val_before,

		-- pv.ag_market as ag_market_before,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.ag_market), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.ag_market), 1), 1) - 1) 
			as ag_market_before,

		-- wpov.ag_hs_use_val as ag_hs_use_val_before, 
		LEFT(CONVERT(varchar(20), CONVERT(money, wpov.ag_hs_use_val), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, wpov.ag_hs_use_val), 1), 1) - 1) 
			as ag_hs_use_val_before,

		-- wpov.ag_use_val as ag_use_val_before,
		LEFT(CONVERT(varchar(20), CONVERT(money, wpov.ag_use_val), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, wpov.ag_use_val), 1), 1) - 1) 
			as ag_use_val_before,

		-- wpov.taxable_classified as taxable_classified_before,
		LEFT(CONVERT(varchar(20), CONVERT(money, wpov.taxable_classified), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, wpov.taxable_classified), 1), 1) - 1) 
			as taxable_classified_before,

		-- wpov.taxable_non_classified as taxable_non_classified_before,
		LEFT(CONVERT(varchar(20), CONVERT(money, wpov.taxable_non_classified), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, wpov.taxable_non_classified), 1), 1) - 1) 
			as taxable_non_classified_before,

		--- Totals ---

		-- (pv.land_hstd_val + pv.land_non_hstd_val + pv.ag_hs_mkt_val + pv.ag_market) as market_land_total_before,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)
											   + ISNULL(pv.ag_hs_mkt_val,0) + ISNULL(pv.ag_market,0)), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)
															   + ISNULL(pv.ag_hs_mkt_val,0) + ISNULL(pv.ag_market,0)), 1), 1) - 1) 
			as market_land_total_before,

		-- (pv.imprv_hstd_val + pv.imprv_non_hstd_val) as market_imprv_total_before,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), 1) - 1) 
			as market_imprv_total_before,

		-- (pv.land_hstd_val + pv.land_non_hstd_val + pv.ag_hs_mkt_val + pv.ag_market + pv.imprv_hstd_val + pv.imprv_non_hstd_val) as market_total_before,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)
											   + ISNULL(pv.ag_hs_mkt_val,0) + ISNULL(pv.ag_market,0)	 
											   + ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)
															   + ISNULL(pv.ag_hs_mkt_val,0) + ISNULL(pv.ag_market,0)	 
															   + ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), 1) - 1) 
			as market_total_before,

		-- (wpov.ag_hs_use_val + wpov.ag_use_val) as cu_land_in_program_total_before,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(wpov.ag_hs_use_val,0) + ISNULL(wpov.ag_use_val,0)), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(wpov.ag_hs_use_val,0) + ISNULL(wpov.ag_use_val,0)), 1), 1) - 1) 
			as cu_land_in_program_total_before,

		-- (pv.land_hstd_val + pv.land_non_hstd_val) as cu_land_non_program_total_before,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)), 1), 1) - 1) 
			as cu_land_non_program_total_before,

		-- (pv.imprv_hstd_val + pv.imprv_non_hstd_val) as cu_imprv_total_before,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), 1) - 1) 
			as cu_imprv_total_before,

		-- (wpov.ag_hs_use_val + wpov.ag_use_val + pv.land_hstd_val + pv.land_non_hstd_val + pv.imprv_hstd_val + pv.imprv_non_hstd_val) as cu_total_before,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)
											   + ISNULL(wpov.ag_hs_use_val,0) + ISNULL(wpov.ag_use_val,0)	 
											   + ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)
															   + ISNULL(wpov.ag_hs_use_val,0) + ISNULL(wpov.ag_use_val,0)	 
															   + ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), 1) - 1) 
			as cu_total_before,

		-- (wpv.appraised_classified) as snr_dsbl_frozen_before,
		LEFT(CONVERT(varchar(20), CONVERT(money, wpv.appraised_classified), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, wpv.appraised_classified), 1), 1) - 1) 
			as snr_dsbl_frozen_before,

		-- (wpv.appraised_non_classified) as snr_dsbl_non_exempt_before,
		LEFT(CONVERT(varchar(20), CONVERT(money, wpv.appraised_non_classified), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, wpv.appraised_non_classified), 1), 1) - 1) 
			as snr_dsbl_non_exempt_before,

		-- ((wpov.taxable_classified + wpov.taxable_non_classified) - wpv.appraised_non_classified) as snr_dsbl_frozen_taxable_before,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(wpov.taxable_classified,0) + ISNULL(wpov.taxable_non_classified,0)
												- ISNULL(wpv.appraised_non_classified,0)), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(wpov.taxable_classified,0) + ISNULL(wpov.taxable_non_classified,0)
															   - ISNULL(wpv.appraised_non_classified,0)), 1), 1) - 1) 
			as snr_dsbl_frozen_taxable_before,

		-- (wpov.taxable_classified + wpov.taxable_non_classified) as total_base_real_property_tax_before,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(wpov.taxable_classified,0) + ISNULL(wpov.taxable_non_classified,0)), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(wpov.taxable_classified,0) + ISNULL(wpov.taxable_non_classified,0)), 1), 1) - 1) 
			as total_base_real_property_taxes_before

	from property_val pv  with(nolock)
	left outer join wash_prop_owner_val wpov with(nolock)
		on wpov.prop_id = pv.prop_id
		and wpov.year = pv.prop_val_yr
		and wpov.sup_num = pv.sup_num
	left outer join wash_property_val wpv with (nolock) 
		on pv.prop_id = wpv.prop_id 
		and pv.prop_val_yr = wpv.prop_val_yr 
		and pv.sup_num = wpv.sup_num 
	where pv.prop_id = @prop_id 
		and pv.prop_val_yr = @prop_val_yr 
		and pv.sup_num =			-- Select the previous one to the MAX sup_num of the property in that year
			(select top 1 prev_sup_num 
			from property_val pv with(nolock) 
			where prop_id = @prop_id and pv.prop_val_yr = @prop_val_yr
			order by pv.sup_num desc )
        
END

ELSE

BEGIN
	SELECT 	
		'Case ID'									AS case_id,
		'Property ID'								AS prop_id,
		'Property Year'								AS prop_val_yr,

		'Previous Appraised Classified Value'		AS appraised_classified_before,
		'Previous Appraised Non-Classified Value'	AS appraised_non_classified_before,
		'Previous Land Homestead Value' 			AS land_hstd_val_before,
		'Previous Land Non-homestead Value' 		AS land_non_hstd_val_before,
		'Previous Imprv Homestead Value' 			AS imprv_hstd_val_before,
		'Previous Imprv Non-homestead Value' 		AS imprv_non_hstd_val_before,
		'Previous Ag Homestead Market Value'  		AS ag_hs_mkt_val_before,
		'Previous Ag Market Value'					AS ag_market_before,
		'Previous Ag Homestead Use Value' 			AS ag_hs_use_val_before,
		'Previous Ag Use Value' 					AS ag_use_val_before,
		'Previous Taxable Classified Value'			AS taxable_classified_before,
		'Previous Taxable Non-Classified Value'		AS taxable_non_classified_before,

		'Previous Market Land Total'				AS market_land_total_before,
		'Previous Market Imprv Total'				AS market_imprv_total_before,
		'Previous Market Total'						AS market_total_before,

		'Previous CU Land In Program Total'			AS cu_land_in_program_total_before,
		'Previous CU Land Non Program Total'		AS cu_land_non_program_total_before,
		'Previous CU Imprv Total'					AS cu_imprv_total_before,
		'Previous CU Total'							AS cu_total_before,

		'Previous SNR-DSBL Frozen Total'			AS snr_dsbl_frozen_before,
		'Previous SNR-DSBL Non-Exempt Total'		AS snr_dsbl_non_exempt_before,
		'Previous SNR-DSBL Frozen Taxable Total'	AS snr_dsbl_frozen_taxable_before,
		'Previous Total Base Real Property Taxes'	AS total_base_real_property_taxes_before

END

GO

