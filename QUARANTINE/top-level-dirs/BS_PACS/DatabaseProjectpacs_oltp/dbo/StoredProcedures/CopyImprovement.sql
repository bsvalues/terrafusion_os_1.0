
CREATE PROCEDURE CopyImprovement

	@input_prop_id      int,
	@input_supp         int,
	@input_tax_yr       int,
	@input_sale_id      int,
	@input_new_prop_id  int,
	@input_new_supp     int,
	@input_new_tax_yr   int,
	@input_new_sale_id  int

AS

	exec dbo.LayerCopyImprovement
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
		null, -- All improvements
		null, -- All details of course
		1, 1, 1 -- Skip entity/exemption/owner assoc

GO

