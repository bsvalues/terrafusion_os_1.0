
create procedure ComparableGridSelectChgOfOwnerPropAssoc

as

	select
		cs.lSaleID, coopa.prop_id, isnull(coopa.bPrimary, 0)
	from #comp_sales_property_saleid as cs with(nolock)
	join chg_of_owner_prop_assoc as coopa with(nolock) on
		coopa.chg_of_owner_id = cs.lSaleID
	order by cs.lSaleID, coopa.prop_id

	return( @@rowcount )

GO

