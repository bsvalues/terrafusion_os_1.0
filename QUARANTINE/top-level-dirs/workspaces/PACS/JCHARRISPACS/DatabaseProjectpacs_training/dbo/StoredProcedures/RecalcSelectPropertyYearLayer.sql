
create procedure RecalcSelectPropertyYearLayer
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0)
as

	if ( @lPacsUserID != 0 )
	begin
			select
				rsa.prop_id,
				convert(smallint, rsa.prop_val_yr),
				convert(smallint, rsa.sup_num)
			from #recalc_history_supp_assoc as rsa with(nolock)
			order by
				rsa.prop_id asc,
				rsa.prop_val_yr asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				psa.prop_id,
				convert(smallint, psa.owner_tax_yr),
				convert(smallint, psa.sup_num)
			from prop_supp_assoc as psa with(nolock)
			where
				psa.owner_tax_yr >= (@lYear - 3) and
				psa.owner_tax_yr < @lYear
			order by
				psa.prop_id asc,
				psa.owner_tax_yr asc
		end
		else
		begin
			select
				psa.prop_id,
				convert(smallint, psa.owner_tax_yr),
				convert(smallint, psa.sup_num)
			from prop_supp_assoc as psa with(nolock)
			where
				psa.prop_id = @lPropID and
				psa.owner_tax_yr >= (@lYear - 3) and
				psa.owner_tax_yr < @lYear
			order by
				psa.prop_id asc,
				psa.owner_tax_yr asc
		end
	end

	return( @@rowcount )

GO

