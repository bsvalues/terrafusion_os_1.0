
create procedure LayerDeleteTablePropertyTaxArea
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int
as

set nocount on

	delete dbo.property_tax_area with(rowlock)
	where
		year = @lYear and
		sup_num = @lSupNum and
		prop_id = @lPropID

	return(0)

GO

