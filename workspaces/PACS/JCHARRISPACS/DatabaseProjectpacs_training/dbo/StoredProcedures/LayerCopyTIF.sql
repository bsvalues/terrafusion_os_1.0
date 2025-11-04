
create procedure LayerCopyTIF
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int

as

set nocount on

insert dbo.tif_area_prop_assoc with(rowlock) (
	tif_area_id,
	prop_id,
	year,
	sup_num
)
select
	tapa.tif_area_id,
	@lPropID_To,
	@lYear_To,
	@lSupNum_To
from dbo.tif_area_prop_assoc as tapa with(nolock)
join dbo.tif_area ta with(nolock)
	on ta.tif_area_id = tapa.tif_area_id
where
	tapa.year = @lYear_From and
	tapa.sup_num = @lSupNum_From and
	tapa.prop_id = @lPropID_From and
	ta.completed = 0 and
	@lYear_To < isnull(ta.expiration_year, 9999)

return(0)

GO

