
-- This stored procedure copies an improvement segment (specified as a parameter) to a new improvement segment.
-- The following tables have data that is copied to have the next improvement segment ID and the specified
-- new property ID, new supplement number, and new property value year:
-- 	imprv
--	imprv_detail
--	imprv_det_adj
--	imprv_adj
--	imprv_attr
--	imprv_owner_assoc - James - not sure why this is listed here, it isn't copied
--	imprv_entity_assoc
--	imprv_exemption_assoc
-- 
-- History:
-- TrentN	05/01/2004	Created
-- JeremyS	2005.10.31	Added fields hs_pct and hs_pct_override to imprv table
-- James 2006-04-11

CREATE PROCEDURE CopySegmentImprvToNewProperty
	@seg_id int,
	@old_prop_id int,
	@old_sup_num int,
	@old_prop_val_yr numeric(4,0),
	@new_prop_id int,
	@new_sup_num int,
	@new_prop_val_yr numeric(4,0),
	
	@old_sale_id int = 0,
	@new_sale_id int = 0
	
AS

	declare @new_seg_id int

	exec @new_seg_id = dbo.LayerCopyImprovement
		-- From
		@old_prop_val_yr,
		@old_sup_num,
		@old_sale_id,
		@old_prop_id,
		-- To
		@new_prop_val_yr,
		@new_sup_num,
		@new_sale_id,
		@new_prop_id,

		1, -- Assign new IDs
		@seg_id, -- One improvement
		null, -- All details on it
		0, 0, 1 -- Skip entity/exemption/owner assoc

	return(@new_seg_id)

GO

