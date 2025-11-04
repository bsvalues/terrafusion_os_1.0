
create procedure LayerDeleteProration
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int
as

set nocount on


	delete ppe
	from dbo.property_prorated_exemptions as ppe with(rowlock)
	where
		ppe.year = @lYear and
		ppe.sup_num = @lSupNum and
		ppe.prop_id = @lPropID


	delete pps
	from dbo.property_prorated_supplements as pps with(rowlock)
	where
		pps.year = @lYear and
		pps.sup_num = @lSupNum and
		pps.prop_id = @lPropID


	return(0)

GO

