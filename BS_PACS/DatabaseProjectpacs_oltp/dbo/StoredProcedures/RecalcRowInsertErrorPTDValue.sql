
create procedure RecalcRowInsertErrorPTDValue
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int,
	@szError varchar(255),

	@ptd_imprv_hstd_val numeric(14,0),
	@pv_imprv_hstd_val numeric(14,0),
	@ptd_imprv_non_hstd_val numeric(14,0),
	@pv_imprv_non_hstd_val numeric(14,0),
	@ptd_land_hstd_val numeric(14,0),
	@pv_land_hstd_val numeric(14,0),
	@ptd_land_non_hstd_val numeric(14,0),
	@pv_land_non_hstd_val numeric(14,0),
	@ptd_ag_use_val numeric(14,0),
	@pv_ag_use_val numeric(14,0),
	@ptd_ag_market numeric(14,0),
	@pv_ag_market numeric(14,0),
	@ptd_timber_use numeric(14,0),
	@pv_timber_use numeric(14,0),
	@ptd_timber_market numeric(14,0),
	@pv_timber_market numeric(14,0),
	@ptd_appraised_val numeric(14,0),
	@pv_appraised_val numeric(14,0),
	@ptd_assessed_val numeric(14,0),
	@pv_assessed_val numeric(14,0),
	@ptd_market_val numeric(14,0),
	@pv_market_val numeric(14,0),
	@ptd_ten_percent_cap numeric(14,0),
	@pv_ten_percent_cap numeric(14,0)
as

set nocount on

	insert prop_recalc_errors with(rowlock) (
		prop_id, sup_yr, sup_num, sale_id, error, error_type,
		ptd_imprv_hstd_val, pv_imprv_hstd_val,
		ptd_imprv_non_hstd_val, pv_imprv_non_hstd_val,
		ptd_land_hstd_val, pv_land_hstd_val,
		ptd_land_non_hstd_val, pv_land_non_hstd_val,
		ptd_ag_use_val, pv_ag_use_val,
		ptd_ag_market, pv_ag_market,
		ptd_timber_use, pv_timber_use,
		ptd_timber_market, pv_timber_market,
		ptd_appraised_val, pv_appraised_val,
		ptd_assessed_val, pv_assessed_val,
		ptd_market_val, pv_market_val,
		ptd_ten_percent_cap, pv_ten_percent_cap
	) values (
		@lPropID, @lYear, @lSupNum, @lSaleID, @szError, 'PTDRV',
		@ptd_imprv_hstd_val, @pv_imprv_hstd_val,
		@ptd_imprv_non_hstd_val, @pv_imprv_non_hstd_val,
		@ptd_land_hstd_val, @pv_land_hstd_val,
		@ptd_land_non_hstd_val, @pv_land_non_hstd_val,
		@ptd_ag_use_val, @pv_ag_use_val,
		@ptd_ag_market, @pv_ag_market,
		@ptd_timber_use, @pv_timber_use,
		@ptd_timber_market, @pv_timber_market,
		@ptd_appraised_val, @pv_appraised_val,
		@ptd_assessed_val, @pv_assessed_val,
		@ptd_market_val, @pv_market_val,
		@ptd_ten_percent_cap, @pv_ten_percent_cap
	)

GO

