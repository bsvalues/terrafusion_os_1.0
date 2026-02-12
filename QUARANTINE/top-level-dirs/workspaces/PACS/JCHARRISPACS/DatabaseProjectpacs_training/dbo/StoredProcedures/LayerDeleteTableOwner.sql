
create procedure LayerDeleteTableOwner
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,

	@lOwnerIDDelete int = null -- A specific owner
as

set nocount on

	exec dbo.LayerDeleteUserTableOwner @lYear, @lSupNum, @lPropID, @lOwnerIDDelete
	
	delete o
	from dbo.owner as o with(rowlock)
	where
		o.owner_tax_yr = @lYear and
		o.sup_num = @lSupNum and
		o.prop_id = @lPropID and
		(@lOwnerIDDelete is null or o.owner_id = @lOwnerIDDelete)

	if ( @lOwnerIDDelete is null )
	begin
		delete dbo.prop_linked_owner with(rowlock)
		where
			prop_val_yr = @lYear and
			sup_num = @lSupNum and
			prop_id = @lPropID
	end
	
	return(0)

GO

