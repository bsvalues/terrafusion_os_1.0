
create procedure ComparableGridAddMultiSaleProperty
	@lYear numeric(4,0)
as

	insert #comp_sales_property_pid (lPropID, lSupNum)
	select distinct coopa.prop_id, psa.sup_num
	from #comp_sales_property_saleid as cs with(nolock)
	join chg_of_owner_prop_assoc as coopa with(nolock) on
		coopa.chg_of_owner_id = cs.lSaleID
	join prop_supp_assoc as psa with(nolock) on
		psa.owner_tax_yr = @lYear and
		psa.prop_id = coopa.prop_id
	where
		not coopa.prop_id in (
			select lPropID from #comp_sales_property_pid
		)

GO

