
create procedure RecalcSelectTaxArea
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int
as

	if ( @lPacsUserID != 0 )
	begin
			select
				pta.prop_id,
				convert(smallint, pta.year),
				convert(smallint, pta.sup_num)
			from #recalc_prop_list as rpl with(nolock)
			join property_tax_area as pta with(nolock) on
				pta.year = rpl.sup_yr and
				pta.sup_num = rpl.sup_num and
				pta.prop_id = rpl.prop_id
			order by 1, 2, 3
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				pta.prop_id,
				convert(smallint, pta.year),
				convert(smallint, pta.sup_num)
			from property_tax_area as pta with(nolock)
			where
				pta.year = @lYear and
				pta.sup_num = @lSupNum
			order by 1, 2, 3
		end
		else
		begin
			select
				pta.prop_id,
				convert(smallint, pta.year),
				convert(smallint, pta.sup_num)
			from property_tax_area as pta with(nolock)
			where
				pta.year = @lYear and
				pta.sup_num = @lSupNum and
				pta.prop_id = @lPropID
			order by 1, 2, 3
		end
	end

	return( @@rowcount )

GO

