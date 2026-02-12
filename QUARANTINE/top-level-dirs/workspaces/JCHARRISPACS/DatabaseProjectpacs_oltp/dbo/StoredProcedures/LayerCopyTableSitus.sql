
create procedure LayerCopyTableSitus
	@lPropID_From int,
	@lPropID_To int
as

set nocount on


	insert dbo.situs with(rowlock) (
		prop_id,
		situs_id,
		primary_situs,
		situs_num,
		situs_street_prefx,
		situs_street,
		situs_street_sufix,
		situs_unit,
		situs_city,
		situs_state,
		situs_zip,
		building_num,
		sub_num
	)
	select
		@lPropID_To,
		situs_id,
		primary_situs,
		situs_num,
		situs_street_prefx,
		situs_street,
		situs_street_sufix,
		situs_unit,
		situs_city,
		situs_state,
		situs_zip,
		building_num,
		sub_num
	from dbo.situs as s with(nolock)
	where
		s.prop_id = @lPropID_From

	return(0)

GO

