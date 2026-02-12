
create procedure RecalcRowUpdatePersonalPropertySegment
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lPPSegID int,

	@pp_deprec_type_cd char(10),
	@pp_deprec_deprec_cd char(10),
	@pp_deprec_override char(1),
	@pp_deprec_pct numeric(5,2),
	@pp_unit_price numeric(14,2),
	@pp_appraised_val numeric(14,0),

	@pp_mkt_val numeric(14,0),

	@pp_special_val numeric(14,0),
	@pp_subseg_val numeric(14,0),
	@pp_orig_cost numeric(14,0),
	@pp_new_val numeric(14,0)
as

set nocount on

	update pers_prop_seg
	set
		pp_deprec_type_cd = @pp_deprec_type_cd,
		pp_deprec_deprec_cd = @pp_deprec_deprec_cd,
		pp_deprec_override = @pp_deprec_override,
		pp_deprec_pct = @pp_deprec_pct,
		pp_unit_price = @pp_unit_price,
		pp_appraised_val = @pp_appraised_val,
		pp_mkt_val = @pp_mkt_val,

		pp_special_val = @pp_special_val,
		pp_subseg_val = @pp_subseg_val,
		pp_orig_cost = @pp_orig_cost,
		pp_new_val = @pp_new_val
	where
		prop_id = @lPropID and
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		pp_seg_id = @lPPSegID

GO

