
create procedure LayerDeleteTableProperty
	@lPropID int
as

set nocount on

	exec dbo.LayerDeleteUserTableProperty @lPropID

	delete p
	from dbo.property as p with(rowlock)
	where
		p.prop_id = @lPropID

	return(0)

GO

