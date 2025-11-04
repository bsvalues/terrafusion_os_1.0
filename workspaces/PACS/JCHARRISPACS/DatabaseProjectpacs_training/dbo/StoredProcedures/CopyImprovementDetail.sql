

create procedure CopyImprovementDetail

	@input_prop_id      int,
	@input_supp         int,
	@input_tax_yr       int,
	@input_imprv_id       int,
	@input_imprv_detail_id int,
	@input_sale_id         int

AS

	exec dbo.LayerCopyImprovement
		-- From
		@input_tax_yr,
		@input_supp,
		@input_sale_id,
		@input_prop_id,
		-- To
		@input_tax_yr,
		@input_supp,
		@input_sale_id,
		@input_prop_id,

		1, -- Assign new IDs
		@input_imprv_id,
		@input_imprv_detail_id,
		1, 1, 1 -- Skip entity/exemption/owner assoc

GO

