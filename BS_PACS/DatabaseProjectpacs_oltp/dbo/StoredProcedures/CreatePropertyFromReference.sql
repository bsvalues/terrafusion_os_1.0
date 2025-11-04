

create procedure CreatePropertyFromReference
	@lNewPropID int,
	@lNewYear numeric(4,0),
	@lRefPropID int,
	@lPenpadRunID int
as

set nocount on

	declare @lRefSupNum int
	declare @lRefYear numeric(4,0)

	select top 1
		@lRefSupNum = sup_num,
		@lRefYear = owner_tax_yr
	from prop_supp_assoc with(nolock)
	where
		prop_id = @lRefPropID
	order by owner_tax_yr desc

	exec CreatePropertySupplementLayer @lRefPropID, @lRefSupNum, @lRefYear, 0, @lNewYear, @lNewPropID

	/* Reference accounts are "deleted", so "un"delete the new property */
	update property_val set
		prop_inactive_dt = null
	where
		prop_id = @lNewPropID and
		prop_val_yr = @lNewYear and
		sup_num = 0

	/* Ensure that the new property is not a reference type, and set the run ID */
	update property set
		reference_flag = 'F',
		reference_desc = null,
		penpad_run_id = @lPenpadRunID
	where
		prop_id = @lNewPropID

set nocount off

GO

