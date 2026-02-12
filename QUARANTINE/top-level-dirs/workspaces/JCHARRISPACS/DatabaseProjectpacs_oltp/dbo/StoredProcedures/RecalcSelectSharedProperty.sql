
create procedure RecalcSelectSharedProperty
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int
as

	if ( @lPacsUserID != 0 )
	begin
			select
				sp.pacs_prop_id,
				convert(smallint, sp.shared_year),
				convert(smallint, sp.sup_num),
				isnull(sp.new_hs_value, 0),
				upper(rtrim(sp.shared_cad_code)),
				isnull(sp.cad_ten_percent_cap, 0),
				isnull(sp.imp_new_value, 0),
				isnull(sp.land_new_value, 0)
			from #recalc_prop_list as rpl with(nolock)
			join shared_prop as sp with(nolock) on
				rpl.prop_id = sp.pacs_prop_id and
				rpl.sup_yr = sp.shared_year and
				rpl.sup_num = sp.sup_num
			order by
				sp.pacs_prop_id asc,
				sp.shared_year asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				sp.pacs_prop_id,
				convert(smallint, sp.shared_year),
				convert(smallint, sp.sup_num),
				isnull(sp.new_hs_value, 0),
				upper(rtrim(sp.shared_cad_code)),
				isnull(sp.cad_ten_percent_cap, 0),
				isnull(sp.imp_new_value, 0),
				isnull(sp.land_new_value, 0)
			from shared_prop as sp with(nolock)
			where
				sp.shared_year = @lYear and
				sp.sup_num = @lSupNum
			order by
				sp.pacs_prop_id asc,
				sp.shared_year asc
		end
		else
		begin
			select
				sp.pacs_prop_id,
				convert(smallint, sp.shared_year),
				convert(smallint, sp.sup_num),
				isnull(sp.new_hs_value, 0),
				upper(rtrim(sp.shared_cad_code)),
				isnull(sp.cad_ten_percent_cap, 0),
				isnull(sp.imp_new_value, 0),
				isnull(sp.land_new_value, 0)
			from shared_prop as sp with(nolock)
			where
				sp.pacs_prop_id = @lPropID and
				sp.shared_year = @lYear and
				sp.sup_num = @lSupNum
			order by
				sp.pacs_prop_id asc,
				sp.shared_year asc
		end
	end

	return( @@rowcount )

GO

