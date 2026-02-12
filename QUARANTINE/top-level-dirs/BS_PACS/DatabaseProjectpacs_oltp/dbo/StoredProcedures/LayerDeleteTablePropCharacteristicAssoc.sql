
create procedure LayerDeleteTablePropCharacteristicAssoc
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int
as

set nocount on

	delete dbo.prop_characteristic_assoc with(rowlock)
	where
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		prop_id = @lPropID

	return(0)

GO

