
create procedure RecalcRowUpdateLand
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int,
	@lLandSegID int,

	@land_seg_mkt_val numeric(14,0),
	@mkt_unit_price numeric(14,2),
	@ag_val numeric(14,0),
	@ag_unit_price numeric(14,2),

	@land_adj_amt numeric(14,0),
	@land_adj_factor numeric(8,6),
	@land_mass_adj_factor numeric(8,6),

	@mkt_calc_val numeric(14,0),
	@mkt_adj_val numeric(14,0),
	@mktappr_val numeric(14,0),

	@ag_calc_val numeric(14,0),
	@ag_loss numeric(14,0),

	@oa_mkt_val numeric(14,0),
	@oa_ag_val numeric(14,0),

	@timber_78_val numeric(14, 0),
	@timber_78_val_pct numeric(13,10),
	
	@ls_mkt_id int,
	@land_new_val numeric(14,0),
	@misc_value numeric(14,0),
	@primary_use_cd varchar(10),
	@non_taxed_mkt_val numeric(14,0)
as

set nocount on

	update land_detail with(rowlock)
	set
		land_seg_mkt_val = @land_seg_mkt_val,
		mkt_unit_price = @mkt_unit_price,
		ag_val = @ag_val,
		ag_unit_price = @ag_unit_price,

		land_adj_amt = @land_adj_amt,
		land_adj_factor = @land_adj_factor,
		land_mass_adj_factor = @land_mass_adj_factor,

		mkt_calc_val = @mkt_calc_val,
		mkt_adj_val = @mkt_adj_val,
		mktappr_val = @mktappr_val,

		ag_calc_val = @ag_calc_val,
		ag_loss = @ag_loss,

		oa_mkt_val = @oa_mkt_val,
		oa_ag_val = @oa_ag_val,
		timber_78_val = @timber_78_val,
		timber_78_val_pct = @timber_78_val_pct,
		ls_mkt_id = @ls_mkt_id,
		land_new_val = @land_new_val,
		new_construction_value = @land_new_val,
		misc_value = @misc_value,
		primary_use_cd = @primary_use_cd,
		non_taxed_mkt_val = @non_taxed_mkt_val
	where
		prop_id = @lPropID and
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		sale_id = @lSaleID and
		land_seg_id = @lLandSegID

GO

