create procedure LayerCopyUserTableProperty
	@lPropID_From int,
	@lPropID_To int
as

set nocount on

	insert dbo.user_property with(rowlock) (
		prop_id,pldd_acreage_assessed
	)
	select
		@lPropID_To,pldd_acreage_assessed
	from dbo.user_property with(nolock)
	where
		prop_id = @lPropID_From

GO

