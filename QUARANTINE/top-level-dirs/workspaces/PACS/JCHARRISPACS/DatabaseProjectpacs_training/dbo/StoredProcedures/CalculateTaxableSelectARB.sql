
create procedure CalculateTaxableSelectARB
	@lYear numeric(4,0),
	@bUseList bit
as

	if ( @bUseList = 1 )
	begin
		select distinct psa.prop_id
		from prop_supp_assoc as psa with(nolock)
		join property_val as pv with(nolock) on
			pv.prop_val_yr = psa.owner_tax_yr and
			pv.sup_num = psa.sup_num and
			pv.prop_id = psa.prop_id
		left outer join _arb_protest as apself with(nolock) on
			apself.prop_val_yr = pv.prop_val_yr and
			apself.prop_id = pv.prop_id and
			apself.prot_complete_dt is null
		left outer join _arb_protest as apparent with(nolock) on
			apparent.prop_val_yr = pv.prop_val_yr and
			apparent.prop_id = pv.udi_parent_prop_id and
			apparent.prot_complete_dt is null
		where
			psa.owner_tax_yr = @lYear and
			psa.prop_id in (select distinct prop_id from #totals_prop_list) and
			(apself.case_id is not null or apparent.case_id is not null)
		order by 1 asc
	end
	else
	begin
		select distinct psa.prop_id
		from prop_supp_assoc as psa with(nolock)
		join property_val as pv with(nolock) on
			pv.prop_val_yr = psa.owner_tax_yr and
			pv.sup_num = psa.sup_num and
			pv.prop_id = psa.prop_id
		left outer join _arb_protest as apself with(nolock) on
			apself.prop_val_yr = pv.prop_val_yr and
			apself.prop_id = pv.prop_id and
			apself.prot_complete_dt is null
		left outer join _arb_protest as apparent with(nolock) on
			apparent.prop_val_yr = pv.prop_val_yr and
			apparent.prop_id = pv.udi_parent_prop_id and
			apparent.prot_complete_dt is null
		where
			psa.owner_tax_yr = @lYear and
			(apself.case_id is not null or apparent.case_id is not null)
		order by 1 asc
	end

	return( @@rowcount )

GO

