
create procedure LayerDeleteTableSitus
	@lPropID int
as

set nocount on


	delete s
	from dbo.situs as s with(rowlock)
	where
		s.prop_id = @lPropID


	return(0)

GO

