
create procedure LayerDeleteTIF
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int
as

set nocount on


	delete tapa
	from dbo.tif_area_prop_assoc as tapa with(rowlock)
	where
		tapa.year = @lYear and
		tapa.sup_num = @lSupNum and
		tapa.prop_id = @lPropID


	return(0)

GO

