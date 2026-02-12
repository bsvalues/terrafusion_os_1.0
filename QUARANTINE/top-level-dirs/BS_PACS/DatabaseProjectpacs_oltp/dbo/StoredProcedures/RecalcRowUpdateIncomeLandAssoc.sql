
create procedure RecalcRowUpdateIncomeLandAssoc
	@income_yr numeric(4,0),
	@sup_num int,
	@sale_id int,
	@income_id int,
	@prop_id int,
	@land_seg_id int,

	@value numeric(14,0)
as

set nocount on

	update income_land_detail_assoc with(rowlock)
	set
		value = @value
	where
		income_yr = @income_yr and
		sup_num = @sup_num and
		sale_id = @sale_id and
		income_id = @income_id and
		prop_id = @prop_id and
		land_seg_id = @land_seg_id

GO

