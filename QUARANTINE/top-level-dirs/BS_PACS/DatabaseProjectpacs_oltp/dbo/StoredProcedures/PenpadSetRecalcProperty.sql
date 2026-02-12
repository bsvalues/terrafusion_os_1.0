

create procedure PenpadSetRecalcProperty
	@lRunID int,
	@lPacsUserID int
as

set nocount on

	declare @lYear numeric(4,0)
	exec GetApprYear @lYear output

	delete recalc_prop_list
	where
		pacs_user_id = convert(bigint, @lPacsUserID)

	insert recalc_prop_list (
		prop_id, sup_num, sup_yr, pacs_user_id
	)
	select
		pc.prop_id, psa.sup_num, @lYear, convert(bigint, @lPacsUserID)
	from penpad_checkout as pc
	join prop_supp_assoc as psa on
		pc.prop_id = psa.prop_id and
		psa.owner_tax_yr = @lYear
	where
		pc.run_id = @lRunID

	declare @lCount int
	select @lCount = @@rowcount

set nocount off

	select lNumProperties = @lCount

GO

