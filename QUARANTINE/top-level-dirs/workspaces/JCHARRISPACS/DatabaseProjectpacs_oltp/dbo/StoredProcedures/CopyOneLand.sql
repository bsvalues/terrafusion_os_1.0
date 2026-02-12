

-- Revision History
-- YYYY.MM.DD	Author			Description
-- ????.??.??	?????			Created
-- 2005.10.31	Jeremy Smith	HS 28018 - Added fields hs_pct and hs_pct_override for land_detail table
-- 2008.06.05 Tedikov Oleksandr #6304 - RETURN value logic was implemented.

CREATE PROCEDURE CopyOneLand

	@input_land_id	     int,
	@input_prop_id      int,
	@input_supp         int,
	@input_tax_yr       int,
	@input_sale_id      int,
	@input_new_prop_id  int,
	@input_new_supp     int,
	@input_new_tax_yr   int,
	@input_new_sale_id  int

AS

DECLARE @newLandID int

EXEC @newLandID = dbo.LayerCopyLand
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
		@input_land_id, -- This specific land segment
		1, 1, 1, -- Skip entity/exemption/owner assoc
		null -- All owners )

RETURN @newLandID

GO

