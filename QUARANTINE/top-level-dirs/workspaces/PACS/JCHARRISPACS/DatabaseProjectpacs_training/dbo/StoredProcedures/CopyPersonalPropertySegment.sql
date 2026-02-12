

-- 1.1 03/03/2004  Rossk Added Personal Property Sub Segments
-- 1.2 03/24/2004  RonaldC Added 'arb_val' to [pers_prop_seg]
CREATE PROCEDURE CopyPersonalPropertySegment

	@input_src_prop_id int,
	@input_src_prop_val_yr int,
	@input_src_sup_num int,
	@input_src_seg_id int,
	@input_dest_prop_id int,
	@input_dest_prop_val_yr int,
	@input_dest_sup_num int

AS

	exec dbo.LayerCopyPersonal
		-- From
		@input_src_prop_val_yr,
		@input_src_sup_num,
		@input_src_prop_id,
		-- To
		@input_dest_prop_val_yr,
		@input_dest_sup_num,
		@input_dest_prop_id,

		1, -- Assign new IDs
		@input_src_seg_id, -- One segment
		1, 1, 1 -- Skip entity/exemption/owner assoc

GO

