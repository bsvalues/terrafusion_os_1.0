
create procedure CalculateTaxableDeleteTaxPreview
	@lPacsUserID int
as

set nocount on

	delete property_entity_tax_preview
	where lPacsUserID = @lPacsUserID

GO

