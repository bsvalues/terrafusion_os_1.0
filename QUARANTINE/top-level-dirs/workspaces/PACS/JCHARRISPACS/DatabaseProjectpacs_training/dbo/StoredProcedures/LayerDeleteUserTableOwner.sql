
create procedure LayerDeleteUserTableOwner
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@lOwnerID int = null
as

set nocount on

	delete dbo.user_owner with(rowlock)
	where
		owner_tax_yr = @lYear and
		sup_num = @lSupNum and
		prop_id = @lPropID and
		(@lOwnerID is null or owner_id = @lOwnerID)

GO

