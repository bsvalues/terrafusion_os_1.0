
-- 1.0 3/24/2004  RonaldC Added 'arb_val' support to copy procedures for land_detail table
-- 1.1 2005.10.31	JeremyS	Added hs_pct and hs_pct_override for land_detail table (HS 28018)

create procedure CopyLand
 @input_prop_id      int,
 @input_supp         int,
 @input_tax_yr       int,
 @input_sale_id      int,
 @input_new_prop_id  int,
 @input_new_supp     int,
 @input_new_tax_yr   int,
 @input_new_sale_id  int
AS

	exec dbo.LayerCopyLand
		-- From
		@input_tax_yr,
		@input_supp,
		@input_sale_id,
		@input_prop_id,
		-- To
		@input_new_tax_yr,
		@input_new_supp,
		@input_new_sale_id,
		@input_new_prop_id,

		1, -- Assign new IDs
		null, -- All land segments
		1, 1, 1, -- Skip entity/exemption/owner assoc
		null -- All owners

GO

