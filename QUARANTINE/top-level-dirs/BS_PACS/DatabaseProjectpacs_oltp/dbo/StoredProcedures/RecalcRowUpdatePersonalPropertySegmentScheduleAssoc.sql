
create procedure RecalcRowUpdatePersonalPropertySegmentScheduleAssoc
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lPPSegID int,
	@lPPSchedID int,

	@unit_price numeric(14,2)
as

set nocount on

	update pp_seg_sched_assoc
	set
		unit_price = @unit_price
	where
		prop_id = @lPropID and
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		pp_seg_id = @lPPSegID and
		pp_sched_id = @lPPSchedID

GO

