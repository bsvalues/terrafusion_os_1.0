


create procedure CompSalesCalcValuePct
	@lApprYear numeric(4,0)
as

set nocount on

	declare
		@lLandVal numeric(28,0),
		@lImprovVal numeric(28,0),
		@lTotalVal numeric(28,0)

	select
		@lLandVal = sum(
			isnull(pv.land_hstd_val, 0) + isnull(pv.land_non_hstd_val, 0)
		),
		@lImprovVal = sum(
			isnull(pv.imprv_hstd_val, 0) + isnull(pv.imprv_non_hstd_val, 0)
		)
	from property_profile as pp with (nolock)
	join property_val as pv with (nolock) on
		pp.prop_id = pv.prop_id and
		pp.prop_val_yr = pv.prop_val_yr and
		pp.sup_num = pv.sup_num
	join prop_supp_assoc as psa with (nolock) on
		pv.prop_id = psa.prop_id and
		pv.prop_val_yr = psa.owner_tax_yr
	join state_code as sc with (nolock) on
		pp.state_cd = sc.state_cd
	where
		pp.prop_val_yr = @lApprYear and
		sc.commercial_acct_flag = 'T'

	set @lTotalVal = @lLandVal + @lImprovVal

set nocount off

	select
		fLandPct = convert(numeric(28,2), @lLandVal) / convert(numeric(28,2), @lTotalVal) * 100.0
		,
		fImprovPct = convert(numeric(28,2), @lImprovVal) / convert(numeric(28,2), @lTotalVal) * 100.0

GO

