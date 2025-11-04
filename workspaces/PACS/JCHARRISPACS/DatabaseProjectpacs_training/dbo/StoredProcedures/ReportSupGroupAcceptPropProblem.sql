
create procedure ReportSupGroupAcceptPropProblem
	@lPacsUserID int,
	@lSupGroupID int
as

set nocount on

	delete report_sup_group_accept_prop_problem
	where lPacsUserID = @lPacsUserID

	-- Props in the group not recalculated
	insert report_sup_group_accept_prop_problem (lPacsUserID, lYear, lSupNum, lPropID, bNotRecalculated, bHasPTDRecalcErrors)
	select @lPacsUserID, pv.prop_val_yr, pv.sup_num, pv.prop_id, 1, 0
	from sup_group as sg with(nolock)
	join supplement as s with(nolock) on
		s.sup_group_id = sg.sup_group_id
	join prop_supp_assoc as psa with(nolock) on
		psa.owner_tax_yr = s.sup_tax_yr and
		psa.sup_num = s.sup_num
	join property_val as pv with(nolock) on
		pv.prop_val_yr = psa.owner_tax_yr and
		pv.sup_num = psa.sup_num and
		pv.prop_id = psa.prop_id
	where
		sg.sup_group_id = @lSupGroupID and
		pv.recalc_dt is null and
		(pv.prop_inactive_dt is null or pv.udi_parent = 'T') and -- Deleted properties need not (and cannot) be recalculated
		pv.accept_create_id is null

	-- Props in the group with ptd recalc errors
	insert report_sup_group_accept_prop_problem (lPacsUserID, lYear, lSupNum, lPropID, bNotRecalculated, bHasPTDRecalcErrors)
	select @lPacsUserID, pv.prop_val_yr, pv.sup_num, pv.prop_id, 0, 1
	from sup_group as sg with(nolock)
	join supplement as s with(nolock) on
		s.sup_group_id = sg.sup_group_id
	join prop_supp_assoc as psa with(nolock) on
		psa.owner_tax_yr = s.sup_tax_yr and
		psa.sup_num = s.sup_num
	join property_val as pv with(nolock) on
		pv.prop_val_yr = psa.owner_tax_yr and
		pv.sup_num = psa.sup_num and
		pv.prop_id = psa.prop_id
	where
		sg.sup_group_id = @lSupGroupID and
		pv.accept_create_id is null and
		exists (
			select top 1 pre.error_id
			from prop_recalc_errors as pre with(nolock)
			where
				pre.sup_yr = pv.prop_val_yr and
				pre.sup_num = pv.sup_num and
				pre.prop_id = pv.prop_id and
				pre.error_type like 'PTD%'
		)
		-- Technically if a prop is not recalculated then it couldn't possibly have PTD recalc errors, but lets check anyway so we can't violate the primary key constraint
		and not exists (
			select r.lPacsUserID
			from report_sup_group_accept_prop_problem as r with(nolock)
			where
				r.lPacsUserID = @lPacsUserID and
				r.lYear = pv.prop_val_yr and
				r.lSupNum = pv.sup_num and
				r.lPropID = pv.prop_id
		)

GO

