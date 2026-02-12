
create procedure RecalcRowUpdateOwner
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lOwnerID int,

	@pct_imprv_hs numeric(13,10),
	@pct_imprv_nhs numeric(13,10),
	@pct_land_hs numeric(13,10),
	@pct_land_nhs numeric(13,10),
	@pct_ag_use numeric(13,10),
	@pct_ag_mkt numeric(13,10),
	@pct_tim_use numeric(13,10),
	@pct_tim_mkt numeric(13,10),
	@pct_ag_use_hs numeric(13,10),
	@pct_ag_mkt_hs numeric(13,10),
	@pct_tim_use_hs numeric(13,10),
	@pct_tim_mkt_hs numeric(13,10),
	@pct_pers_prop numeric(13,10)
as

set nocount on

	update owner with(rowlock)
	set
		pct_imprv_hs = @pct_imprv_hs,
		pct_imprv_nhs = @pct_imprv_nhs,
		pct_land_hs = @pct_land_hs,
		pct_land_nhs = @pct_land_nhs,
		pct_ag_use = @pct_ag_use,
		pct_ag_mkt = @pct_ag_mkt,
		pct_tim_use = @pct_tim_use,
		pct_tim_mkt = @pct_tim_mkt,
		pct_ag_use_hs = @pct_ag_use_hs,
		pct_ag_mkt_hs = @pct_ag_mkt_hs,
		pct_tim_use_hs = @pct_tim_use_hs,
		pct_tim_mkt_hs = @pct_tim_mkt_hs,
		pct_pers_prop = @pct_pers_prop
	where
		prop_id = @lPropID and
		owner_tax_yr = @lYear and
		sup_num = @lSupNum and
		owner_id = @lOwnerID

GO

