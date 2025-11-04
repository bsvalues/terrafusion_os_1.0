
CREATE PROCEDURE [dbo].[InquiryCurrentSupplementValues]

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

		-- wpv.appraised_classified as appraised_classified_current, 
		LEFT(CONVERT(varchar(20), CONVERT(money, wpv.appraised_classified), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, wpv.appraised_classified), 1), 1) - 1) 
			as appraised_classified_current,

		-- wpv.appraised_non_classified as appraised_non_classified_current,
		LEFT(CONVERT(varchar(20), CONVERT(money, wpv.appraised_non_classified), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, wpv.appraised_non_classified), 1), 1) - 1) 
			as appraised_non_classified_current,

		-- pv.land_hstd_val as land_hstd_val_current,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.land_hstd_val), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.land_hstd_val), 1), 1) - 1) 
			as land_hstd_val_current,

		-- pv.land_non_hstd_val as land_non_hstd_val_current,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.land_non_hstd_val), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.land_non_hstd_val), 1), 1) - 1) 
			as land_non_hstd_val_current,

		-- pv.imprv_hstd_val as imprv_hstd_val_current,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.imprv_hstd_val), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.imprv_hstd_val), 1), 1) - 1) 
			as imprv_hstd_val_current,

		-- pv.imprv_non_hstd_val as imprv_non_hstd_val_current,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.imprv_non_hstd_val), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.imprv_non_hstd_val), 1), 1) - 1) 
			as imprv_non_hstd_val_current,

		-- pv.ag_hs_mkt_val as ag_hs_mkt_val_current,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.ag_hs_mkt_val), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.ag_hs_mkt_val), 1), 1) - 1) 
			as ag_hs_mkt_val_current,

		-- pv.ag_market as ag_market_current,
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.ag_market), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.ag_market), 1), 1) - 1) 
			as ag_market_current,

		-- wpov.ag_hs_use_val as ag_hs_use_val_current, 
		LEFT(CONVERT(varchar(20), CONVERT(money, wpov.ag_hs_use_val), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, wpov.ag_hs_use_val), 1), 1) - 1) 
			as ag_hs_use_val_current,

		-- wpov.ag_use_val as ag_use_val_current,
		LEFT(CONVERT(varchar(20), CONVERT(money, wpov.ag_use_val), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, wpov.ag_use_val), 1), 1) - 1) 
			as ag_use_val_current,

		-- wpov.taxable_classified as taxable_classified_current,
		LEFT(CONVERT(varchar(20), CONVERT(money, wpov.taxable_classified), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, wpov.taxable_classified), 1), 1) - 1) 
			as taxable_classified_current,

		-- wpov.taxable_non_classified as taxable_non_classified_current,
		LEFT(CONVERT(varchar(20), CONVERT(money, wpov.taxable_non_classified), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, wpov.taxable_non_classified), 1), 1) - 1) 
			as taxable_non_classified_current,

		--- Totals ---

		-- (pv.land_hstd_val + pv.land_non_hstd_val + pv.ag_hs_mkt_val + pv.ag_market) as market_land_total_current,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)
											   + ISNULL(pv.ag_hs_mkt_val,0) + ISNULL(pv.ag_market,0)), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)
															   + ISNULL(pv.ag_hs_mkt_val,0) + ISNULL(pv.ag_market,0)), 1), 1) - 1) 
			as market_land_total_current,

		-- (pv.imprv_hstd_val + pv.imprv_non_hstd_val) as market_imprv_total_current,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), 1) - 1) 
			as market_imprv_total_current,

		-- (pv.land_hstd_val + pv.land_non_hstd_val + pv.ag_hs_mkt_val + pv.ag_market + pv.imprv_hstd_val + pv.imprv_non_hstd_val) as market_total_current,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)
											   + ISNULL(pv.ag_hs_mkt_val,0) + ISNULL(pv.ag_market,0)	 
											   + ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)
															   + ISNULL(pv.ag_hs_mkt_val,0) + ISNULL(pv.ag_market,0)	 
															   + ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), 1) - 1) 
			as market_total_current,

		-- (wpov.ag_hs_use_val + wpov.ag_use_val) as cu_land_in_program_total_current,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(wpov.ag_hs_use_val,0) + ISNULL(wpov.ag_use_val,0)), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(wpov.ag_hs_use_val,0) + ISNULL(wpov.ag_use_val,0)), 1), 1) - 1) 
			as cu_land_in_program_total_current,

		-- (pv.land_hstd_val + pv.land_non_hstd_val) as cu_land_non_program_total_current,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)), 1), 1) - 1) 
			as cu_land_non_program_total_current,

		-- (pv.imprv_hstd_val + pv.imprv_non_hstd_val) as cu_imprv_total_current,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), 1) - 1) 
			as cu_imprv_total_current,

		-- (wpov.ag_hs_use_val + wpov.ag_use_val + pv.land_hstd_val + pv.land_non_hstd_val + pv.imprv_hstd_val + pv.imprv_non_hstd_val) as cu_total_current,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)
											   + ISNULL(wpov.ag_hs_use_val,0) + ISNULL(wpov.ag_use_val,0)	 
											   + ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(pv.land_hstd_val,0) + ISNULL(pv.land_non_hstd_val,0)
															   + ISNULL(wpov.ag_hs_use_val,0) + ISNULL(wpov.ag_use_val,0)	 
															   + ISNULL(pv.imprv_hstd_val,0) + ISNULL(pv.imprv_non_hstd_val,0)), 1), 1) - 1) 
			as cu_total_current,

		-- (wpv.appraised_classified) as snr_dsbl_frozen_current,
		LEFT(CONVERT(varchar(20), CONVERT(money, wpv.appraised_classified), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, wpv.appraised_classified), 1), 1) - 1) 
			as snr_dsbl_frozen_current,

		-- (wpv.appraised_non_classified) as snr_dsbl_non_exempt_current,
		LEFT(CONVERT(varchar(20), CONVERT(money, wpv.appraised_non_classified), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, wpv.appraised_non_classified), 1), 1) - 1) 
			as snr_dsbl_non_exempt_current,

		-- ((wpov.taxable_classified + wpov.taxable_non_classified) - wpv.appraised_non_classified) as snr_dsbl_frozen_taxable_current,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(wpov.taxable_classified,0) + ISNULL(wpov.taxable_non_classified,0)
												- ISNULL(wpv.appraised_non_classified,0)), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(wpov.taxable_classified,0) + ISNULL(wpov.taxable_non_classified,0)
															   - ISNULL(wpv.appraised_non_classified,0)), 1), 1) - 1) 
			as snr_dsbl_frozen_taxable_current,

		-- (wpov.taxable_classified + wpov.taxable_non_classified) as total_base_real_property_tax_current,
		LEFT(CONVERT(varchar(20), CONVERT(money, ISNULL(wpov.taxable_classified,0) + ISNULL(wpov.taxable_non_classified,0)), 1), 
			 CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, ISNULL(wpov.taxable_classified,0) + ISNULL(wpov.taxable_non_classified,0)), 1), 1) - 1) 
			as total_base_real_property_taxes_current

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
		and pv.sup_num =			-- Select the MAX sup_num for the property in that year
			(select top 1 sup_num 
			from property_val pv  with(nolock) 
			where prop_id = @prop_id and pv.prop_val_yr = @prop_val_yr
			order by pv.sup_num desc )
        
END

ELSE

BEGIN
	SELECT 	
		'Case ID'									AS case_id,
		'Property ID'								AS prop_id,
		'Property Year'								AS prop_val_yr,

		'Current Appraised Classified Value'		AS appraised_classified_current,
		'Current Appraised Non-Classified Value'	AS appraised_non_classified_current,
		'Current Land Homestead Value' 				AS land_hstd_val_current,
		'Current Land Non-homestead Value' 			AS land_non_hstd_val_current,
		'Current Imprv Homestead Value' 			AS imprv_hstd_val_current,
		'Current Imprv Non-homestead Value' 		AS imprv_non_hstd_val_current,
		'Current Ag Homestead Market Value'  		AS ag_hs_mkt_val_current,
		'Current Ag Market Value'					AS ag_market_current,
		'Current Ag Homestead Use Value' 			AS ag_hs_use_val_current,
		'Current Ag Use Value' 						AS ag_use_val_current,
		'Current Taxable Classified Value'			AS taxable_classified_current,
		'Current Taxable Non-Classified Value'		AS taxable_non_classified_current,

		'Current Market Land Total'					AS market_land_total_current,
		'Current Market Imprv Total'				AS market_imprv_total_current,
		'Current Market Total'						AS market_total_current,

		'Current CU Land In Program Total'			AS cu_land_in_program_total_current,
		'Current CU Land Non Program Total'			AS cu_land_non_program_total_current,
		'Current CU Imprv Total'					AS cu_imprv_total_current,
		'Current CU Total'							AS cu_total_current,

		'Current SNR-DSBL Frozen Total'				AS snr_dsbl_frozen_current,
		'Current SNR-DSBL Non-Exempt Total'			AS snr_dsbl_non_exempt_current,
		'Current SNR-DSBL Frozen Taxable Total'		AS snr_dsbl_frozen_taxable_current,
		'Current Total Base Real Property Taxes'	AS total_base_real_property_taxes_current

END

GO

