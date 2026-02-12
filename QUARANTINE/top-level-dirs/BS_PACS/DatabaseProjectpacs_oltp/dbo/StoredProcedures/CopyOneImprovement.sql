
--1.0  03/24/2004 RonaldC Added 'arb_val' support to copy procedures
--1.1  04/05/2004 TrentN  Added fields for imprv_detail and imprv_attr
--1.2  09/10/2004 ChrisN Added upport for the sketch notes
--1.3  2005.10.31 JeremyS	Added fields hs_pct and hs_pct_override for imprv table

CREATE  PROCEDURE CopyOneImprovement

	@input_prop_id      int,
	@input_supp         int,
	@input_tax_yr       int,
	@input_imprv_id     int,
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
		@input_imprv_id, -- This specific improvements
		null, -- All details of course
		1, 1, 1 -- Skip entity/exemption/owner assoc

GO

