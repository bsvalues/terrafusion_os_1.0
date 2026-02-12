
create procedure LayerDeleteShared
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int
as

set nocount on


	delete spv
	from dbo.shared_prop_value as spv with(rowlock)
	where
		spv.shared_year = @lYear and
		spv.sup_num = @lSupNum and
		spv.pacs_prop_id = @lPropID


	delete sp
	from dbo.shared_prop as sp with(rowlock)
	where
		sp.shared_year = @lYear and
		sp.sup_num = @lSupNum and
		sp.pacs_prop_id = @lPropID


	return(0)

GO

