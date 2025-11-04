
create procedure RecalcRowUpdateLandMiscCode
	@prop_val_yr numeric(4,0),
	@sup_num int,
	@sale_id int,
	@prop_id int,
	@misc_id int,
	@value numeric(14,3),
	@index numeric(8,2),
	@indexed_value numeric(14,0),
	@sched_id int,
	@calc_value numeric(14,0)
as

set nocount on

	update property_land_misc_code
	set
		value = @value,
		[index] = @index,
		indexed_value = @indexed_value,
		sched_id = case when @sched_id = 0 then null else @sched_id end,
		calc_value = @calc_value
	from property_land_misc_code
	where
		prop_val_yr = @prop_val_yr and
		sup_num = @sup_num and
		sale_id = @sale_id and
		prop_id = @prop_id and
		misc_id = @misc_id

GO

