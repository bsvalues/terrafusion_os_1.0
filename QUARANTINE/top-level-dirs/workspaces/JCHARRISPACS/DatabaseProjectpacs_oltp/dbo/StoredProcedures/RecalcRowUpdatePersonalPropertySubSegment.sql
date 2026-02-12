
create procedure RecalcRowUpdatePersonalPropertySubSegment
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lPPSegID int,
	@lPPSubSegID int,

	@pp_mkt_val numeric(14,0),
	@pp_rendered_val numeric(14,0),
	@pp_dep_pct numeric(5,2)
as

set nocount on

	update pers_prop_sub_seg
	set
		pp_mkt_val = @pp_mkt_val,
		pp_rendered_val = @pp_rendered_val,
		pp_dep_pct = @pp_dep_pct
	where
		prop_id = @lPropID and
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		pp_seg_id = @lPPSegID and
		pp_sub_seg_id = @lPPSubSegID

GO

