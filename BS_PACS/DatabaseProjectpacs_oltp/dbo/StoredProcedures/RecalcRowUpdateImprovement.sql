
create procedure RecalcRowUpdateImprovement
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int,
	@lImprovID int,

	@imp_new_val numeric(14,0),
	@imp_new_val_override char(1),

	@imprv_adj_factor numeric(8,6),
	@imprv_adj_amt numeric(14,0),
	@imprv_mass_adj_factor numeric(8,6),

	@calc_val numeric(14,0),
	@adjusted_val numeric(14,0),
	@imprv_val numeric(14,0),
	@income_val numeric(14,0),
	@mktappr_val numeric(14,0),

	@imp_new_yr numeric(4,0),
	
	@primary_use_cd varchar(10),
	@secondary_use_cd varchar(10),
	
	@permanent_crop_land_acres numeric(14,4)
as

set nocount on

	update imprv with(rowlock)
	set
		imp_new_val = @imp_new_val,
		imp_new_val_override = @imp_new_val_override,

		imprv_adj_factor = @imprv_adj_factor,
		imprv_adj_amt = @imprv_adj_amt,
		imprv_mass_adj_factor = @imprv_mass_adj_factor,

		calc_val = @calc_val,
		adjusted_val = @adjusted_val,
		imprv_val = @imprv_val,
		income_val = @income_val,
		mktappr_val = @mktappr_val,

		imp_new_yr = @imp_new_yr,
		
		primary_use_cd = @primary_use_cd,
		secondary_use_cd = @secondary_use_cd,
		
		permanent_crop_land_acres = @permanent_crop_land_acres
	where
		prop_id = @lPropID and
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		sale_id = @lSaleID and
		imprv_id = @lImprovID

GO

