

create procedure RecalcSelectVITSales
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0)
as

	if ( @lPacsUserID != 0 )
	begin
			select
				vs.vit_sales_id,
				vs.prop_id,
				convert(smallint, vs.year),
				convert(smallint, vs.month),
				vs.total_sales
			from #recalc_prop_list as rpl with(nolock)
			join vit_sales as vs with(nolock) on
				rpl.prop_id = vs.prop_id and
				(rpl.sup_yr - 1) = vs.year
			order by
				vs.prop_id asc, vs.year asc, vs.month asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				vs.vit_sales_id,
				vs.prop_id,
				convert(smallint, vs.year),
				convert(smallint, vs.month),
				vs.total_sales
			from vit_sales as vs with(nolock)
			where
				vs.year = (@lYear - 1)
			order by
				vs.prop_id asc, vs.year asc, vs.month asc
		end
		else
		begin
			select
				vs.vit_sales_id,
				vs.prop_id,
				convert(smallint, vs.year),
				convert(smallint, vs.month),
				vs.total_sales
			from vit_sales as vs with(nolock)
			where
				vs.prop_id = @lPropID and
				vs.year = (@lYear - 1)
			order by
				vs.prop_id asc, vs.year asc, vs.month asc
		end
	end

	return( @@rowcount )

GO

