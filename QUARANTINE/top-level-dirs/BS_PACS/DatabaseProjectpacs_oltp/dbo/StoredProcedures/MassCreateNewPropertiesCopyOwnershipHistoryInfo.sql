
CREATE PROCEDURE MassCreateNewPropertiesCopyOwnershipHistoryInfo

	@source_prop_id		int,
	@new_prop_id		int

AS

	declare @source_chg_of_owner_id int
	declare @new_chg_of_owner_id	int

	declare CHG_OF_OWNER CURSOR FAST_FORWARD
	for SELECT DISTINCT chg_of_owner_id
		FROM chg_of_owner_prop_assoc WITH (NOLOCK)
		WHERE prop_id = @source_prop_id
		ORDER BY chg_of_owner_id

	OPEN CHG_OF_OWNER

	FETCH NEXT FROM CHG_OF_OWNER INTO @source_chg_of_owner_id

	WHILE @@FETCH_STATUS = 0
	BEGIN
		exec dbo.GetUniqueID 'chg_of_owner', @new_chg_of_owner_id output, 1, 0

		insert into chg_of_owner
		(
			chg_of_owner_id,
			deed_type_cd,
			deed_num,
			deed_book_id,
			deed_book_page,
			deed_dt,
			coo_sl_dt,
			consideration,
			buyer_lttr_url,
			seller_lttr_url,
			buyer_lttr_prt_dt,
			seller_lttr_prt_dt,
			comment,
			ref_id1,
			grantor_cv,
			grantee_cv,
			recorded_dt
		)
		select
			@new_chg_of_owner_id,
			coo.deed_type_cd,
			coo.deed_num,
			coo.deed_book_id,
			coo.deed_book_page,
			coo.deed_dt,
			coo.coo_sl_dt,
			coo.consideration,
			coo.buyer_lttr_url,
			coo.seller_lttr_url,
			coo.buyer_lttr_prt_dt,
			coo.seller_lttr_prt_dt,
			coo.comment,
			coo.ref_id1,
			coo.grantor_cv,
			coo.grantee_cv,
			coo.recorded_dt
		from chg_of_owner AS coo WITH (NOLOCK)
		WHERE coo.chg_of_owner_id = @source_chg_of_owner_id

		insert into chg_of_owner_prop_assoc
		(
			chg_of_owner_id,
			prop_id,
			seq_num,
			sup_tax_yr,
			imprv_hstd_val,
			imprv_non_hstd_val,
			land_hstd_val,
			land_non_hstd_val,
			ag_use_val,
			ag_market,
			ag_loss,
			timber_use,
			timber_market,
			timber_loss,
			appraised_val,
			assessed_val,
			market
		)
		select
			@new_chg_of_owner_id,
			@new_prop_id,
			coopa.seq_num,
			coopa.sup_tax_yr,
			coopa.imprv_hstd_val,
			coopa.imprv_non_hstd_val,
			coopa.land_hstd_val,
			coopa.land_non_hstd_val,
			coopa.ag_use_val,
			coopa.ag_market,
			coopa.ag_loss,
			coopa.timber_use,
			coopa.timber_market,
			coopa.timber_loss,
			coopa.appraised_val,
			coopa.assessed_val,
			coopa.market
		from chg_of_owner_prop_assoc AS coopa WITH (NOLOCK)
		WHERE coopa.chg_of_owner_id = @source_chg_of_owner_id
		AND coopa.prop_id = @source_prop_id

		insert into buyer_assoc
		(
			chg_of_owner_id,
			buyer_id
		)
		select
			@new_chg_of_owner_id,
			ba.buyer_id
		FROM buyer_assoc AS ba WITH (NOLOCK)
		WHERE ba.chg_of_owner_id = @source_chg_of_owner_id

		-- HelpSTAR 12631
		-- Fix a problem where the same seller_id is associated more than once with a single chg_of_owner_id
		-- Changed from:	SELECT sa.seller_id
		-- Changed to:		SELECT DISTINCT sa.seller_id

		insert into seller_assoc
		(
			seller_id,
			chg_of_owner_id,
			prop_id
		)
		SELECT DISTINCT
			sa.seller_id,
			@new_chg_of_owner_id,
			@new_prop_id
		FROM seller_assoc AS sa WITH (NOLOCK)
		WHERE sa.chg_of_owner_id = @source_chg_of_owner_id

		insert into sale
		(
			chg_of_owner_id,
			sl_ratio,
			sl_financing_cd,
			sl_ratio_type_cd,
			sl_adj_cd,
			sl_type_cd,
			sl_state_cd,
			sl_class_cd,
			sl_land_type_cd,
			sl_price,
			sl_dt,
			adjusted_sl_price,
			realtor,
			finance_comment,
			amt_down,
			amt_financed,
			interest_rate,
			finance_yrs,
			suppress_on_ratio_rpt_cd,
			suppress_on_ratio_rsn,
			sl_adj_sl_pct,
			sl_adj_sl_amt,
			sl_adj_rsn,
			sl_comment,
			sl_yr_blt,
			sl_living_area,
			sl_imprv_unit_price,
			sl_land_sqft,
			sl_land_acres,
			sl_land_front_feet,
			sl_land_depth,
			sl_land_unit_price,
			sl_school_id,
			sl_city_id,
			sl_qualifier,
			include_no_calc,
			sl_ratio_cd,
			import_dt,
			include_reason,
			sales_exclude_calc_cd,
			amt_financed_2,
			interest_rate_2,
			finance_yrs_2,
			sl_sub_class_cd,
			sl_imprv_type_cd,
			confidential_sale,
			frozen_characteristics,
			num_days_on_market,
			sl_exported_flag,
			land_only_sale,
			monthly_income,
			annual_income
		)
		select
			@new_chg_of_owner_id,
			s.sl_ratio,
			s.sl_financing_cd,
			s.sl_ratio_type_cd,
			s.sl_adj_cd,
			s.sl_type_cd,
			s.sl_state_cd,
			s.sl_class_cd,
			s.sl_land_type_cd,
			s.sl_price,
			s.sl_dt,
			s.adjusted_sl_price,
			s.realtor,
			s.finance_comment,
			s.amt_down,
			s.amt_financed,
			s.interest_rate,
			s.finance_yrs,
			s.suppress_on_ratio_rpt_cd,
			s.suppress_on_ratio_rsn,
			s.sl_adj_sl_pct,
			s.sl_adj_sl_amt,
			s.sl_adj_rsn,
			s.sl_comment,
			s.sl_yr_blt,
			s.sl_living_area,
			s.sl_imprv_unit_price,
			s.sl_land_sqft,
			s.sl_land_acres,
			s.sl_land_front_feet,
			s.sl_land_depth,
			s.sl_land_unit_price,
			s.sl_school_id,
			s.sl_city_id,
			s.sl_qualifier,
			s.include_no_calc,
			s.sl_ratio_cd,
			s.import_dt,
			s.include_reason,
			s.sales_exclude_calc_cd,
			s.amt_financed_2,
			s.interest_rate_2,
			s.finance_yrs_2,
			s.sl_sub_class_cd,
			s.sl_imprv_type_cd,
			s.confidential_sale,
			s.frozen_characteristics,
			s.num_days_on_market,
			s.sl_exported_flag,
			s.land_only_sale,
			s.monthly_income,
			s.annual_income
		from sale as s WITH (NOLOCK)
		WHERE s.chg_of_owner_id = @source_chg_of_owner_id

		FETCH NEXT FROM CHG_OF_OWNER INTO @source_chg_of_owner_id
	END

	CLOSE CHG_OF_OWNER
	DEALLOCATE CHG_OF_OWNER

GO

