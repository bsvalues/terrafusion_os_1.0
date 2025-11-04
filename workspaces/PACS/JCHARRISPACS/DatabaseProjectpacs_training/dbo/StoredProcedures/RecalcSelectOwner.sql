
create procedure RecalcSelectOwner
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int
as

	if ( @lPacsUserID != 0 )
	begin
			select
				o.prop_id,
				convert(smallint, o.owner_tax_yr),
				convert(smallint, o.sup_num),
				o.owner_id,
				isnull(o.pct_ownership, 100.0),
				o.udi_child_prop_id,
				isnull(o.percent_type, 'O'),
				convert(bit, case o.apply_pct_exemptions when 'T' then 1 else 0 end),
				convert(bit, 	case o.ag_app_filed 
							when 'T' then 1 
							when 'Y' then 1 
							else 0 
						end)
			from #recalc_prop_list as rpl with(nolock)
			join owner as o with(nolock) on
				rpl.prop_id = o.prop_id and
				rpl.sup_yr = o.owner_tax_yr and
				rpl.sup_num = o.sup_num
			where
				(o.udi_child_prop_id is not null or o.percent_type = 'S' or o.pct_ownership <> 100.0)
			order by
				1 asc, 2 asc, 3 asc, 4 asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				o.prop_id,
				convert(smallint, o.owner_tax_yr),
				convert(smallint, o.sup_num),
				o.owner_id,
				isnull(o.pct_ownership, 100.0),
				o.udi_child_prop_id,
				isnull(o.percent_type, 'O'),
				convert(bit, case o.apply_pct_exemptions when 'T' then 1 else 0 end),
				convert(bit, 	case o.ag_app_filed 
							when 'T' then 1 
							when 'Y' then 1 
							else 0 
						end)
			from owner as o with(nolock)
			where
				o.owner_tax_yr = @lYear and
				o.sup_num = @lSupNum and
				(o.udi_child_prop_id is not null or o.percent_type = 'S' or o.pct_ownership <> 100.0)
			order by
				1 asc, 2 asc, 3 asc, 4 asc
		end
		else
		begin
			select
				o.prop_id,
				convert(smallint, o.owner_tax_yr),
				convert(smallint, o.sup_num),
				o.owner_id,
				isnull(o.pct_ownership, 100.0),
				o.udi_child_prop_id,
				isnull(o.percent_type, 'O'),
				convert(bit, case o.apply_pct_exemptions when 'T' then 1 else 0 end),
				convert(bit, 	case o.ag_app_filed 
							when 'T' then 1 
							when 'Y' then 1 
							else 0 
						end)
			from owner as o with(nolock)
			where
				o.prop_id = @lPropID and
				o.owner_tax_yr = @lYear and
				o.sup_num = @lSupNum and
				(o.udi_child_prop_id is not null or o.percent_type = 'S' or o.pct_ownership <> 100.0)
			order by
				1 asc, 2 asc, 3 asc, 4 asc
		end
	end

	return( @@rowcount )

GO

