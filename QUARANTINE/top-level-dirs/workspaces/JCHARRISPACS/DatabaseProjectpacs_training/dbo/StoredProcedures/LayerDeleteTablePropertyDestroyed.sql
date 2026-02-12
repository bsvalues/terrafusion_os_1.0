
create procedure LayerDeleteTablePropertyDestroyed
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int
as

set nocount on

	delete dbo.destroyed_property with(rowlock)
	where
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		prop_id = @lPropID

	return(0)

GO

