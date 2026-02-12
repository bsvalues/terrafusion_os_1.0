
create procedure LayerDeleteTableEntityPropAssoc
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int
as

set nocount on

	delete epa
	from dbo.entity_prop_assoc as epa with(rowlock)
	where
		epa.tax_yr = @lYear and
		epa.sup_num = @lSupNum and
		epa.prop_id = @lPropID


	return(0)

GO

