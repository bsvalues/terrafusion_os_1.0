
create procedure RecalcRowUpdateSharedProperty
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@szSharedCADCode varchar(5),
	@imprv_hs_val numeric(14,0),
	@imprv_non_hs_val numeric(14,0),
	@land_hs numeric(14,0),
	@land_non_hs numeric(14,0),
	@ag_use_val numeric(14,0),
	@ag_market numeric(14,0),
	@timber_use numeric(14,0),
	@timber_market numeric(14,0),
	@market numeric(14,0),
	@productivity_loss numeric(14,0),
	@appraised_val numeric(14,0),
	@cad_assessed_val numeric(14,0)
as

set nocount on

	update shared_prop with(rowlock)
	set
		imprv_hs_val = @imprv_hs_val,
		imprv_non_hs_val = @imprv_non_hs_val,
		land_hs = @land_hs,
		land_non_hs = @land_non_hs,
		ag_use_val = @ag_use_val,
		ag_market = @ag_market,
		timber_use = @timber_use,
		timber_market = @timber_market,
		market = @market,
		productivity_loss = @productivity_loss,
		appraised_val = @appraised_val,
		cad_assessed_val = @cad_assessed_val
	where
		pacs_prop_id = @lPropID and
		shared_year = @lYear and
		sup_num = @lSupNum and
		shared_cad_code = @szSharedCADCode

GO

