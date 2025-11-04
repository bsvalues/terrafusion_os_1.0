
create procedure ImprvSketchAddBytes
	@prop_id int,
	@prop_val_yr numeric(4,0),
	@imprv_id int,
	@sup_num int,
	@sale_id int,
	@binData varbinary(max),
	@startIndex bigint,
	@dataLength bigint
as

set nocount on

	update imprv_sketch
	set sketch.write(@binData, @startIndex, @dataLength)
	where
		prop_id = @prop_id and
		prop_val_yr = @prop_val_yr and
		imprv_id = @imprv_id and
		sup_num = @sup_num and
		sale_id = @sale_id

GO

