
create procedure RecalcRowUpdateChgOfOwnerPropAssoc
	@lSaleID int,
	@lPropID int,

	@imprv_hstd_val numeric(14,0),
	@imprv_non_hstd_val numeric(14,0),
	@land_hstd_val numeric(14,0),
	@land_non_hstd_val numeric(14,0),
	@ag_use_val numeric(14,0),
	@ag_market numeric(14,0),
	@ag_loss numeric(14,0),
	@timber_use numeric(14,0),
	@timber_market numeric(14,0),
	@timber_loss numeric(14,0),
	@appraised_val numeric(14,0),
	@assessed_val numeric(14,0),
	@market numeric(14,0)
as

set nocount on

	update chg_of_owner_prop_assoc with(rowlock)
	set
		imprv_hstd_val = @imprv_hstd_val,
		imprv_non_hstd_val = @imprv_non_hstd_val,
		land_hstd_val = @land_hstd_val,
		land_non_hstd_val = @land_non_hstd_val,
		ag_use_val = @ag_use_val,
		ag_market = @ag_market,
		ag_loss = @ag_loss,
		timber_use = @timber_use,
		timber_market = @timber_market,
		timber_loss = @timber_loss,
		appraised_val = @appraised_val,
		assessed_val = @assessed_val,
		market = @market
	where
		chg_of_owner_id = @lSaleID and
		prop_id = @lPropID

GO

