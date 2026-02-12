
create procedure LayerDeleteUserTableProperty
	@lPropID int
as

set nocount on

	delete dbo.user_property with(rowlock)
	where
		prop_id = @lPropID

GO

