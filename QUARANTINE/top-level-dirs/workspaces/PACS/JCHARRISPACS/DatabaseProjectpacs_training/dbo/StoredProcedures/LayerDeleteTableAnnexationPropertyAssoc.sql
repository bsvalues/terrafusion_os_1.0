
create procedure LayerDeleteTableAnnexationPropertyAssoc
	@PropID int,
	@Year numeric(4,0)
as

set nocount on
	
	delete apa
	from dbo.annexation_property_assoc as apa with(rowlock)
	where
		apa.prop_id = @PropID and
		apa.[year] = @Year

	return (0)

GO

