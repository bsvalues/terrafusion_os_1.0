
create procedure RecalcSelectSharedPropertyValue
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
				upper(rtrim(sp.shared_cad_code)),
				upper(rtrim(sp.record_type)),
				isnull(sp.shared_value, 0),
				upper(rtrim(sp.ag_use_code)),
				isnull(sp.ag_use_value, 0),
				convert(
					bit,
					case sp.homesite_flag
						when 'T' then 1
						else 0
					end
				),
				upper(rtrim(sp.state_code)),
				sp.acres,
				convert( numeric(13,10),
                                         ISNULL( sp.hs_pct, 100 ) ) 

			from #recalc_prop_list as rpl with(nolock)
			join shared_prop_value as sp with(nolock) on
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
				upper(rtrim(sp.shared_cad_code)),
				upper(rtrim(sp.record_type)),
				isnull(sp.shared_value, 0),
				upper(rtrim(sp.ag_use_code)),
				isnull(sp.ag_use_value, 0),
				convert(
					bit,
					case sp.homesite_flag
						when 'T' then 1
						else 0
					end
				),
				upper(rtrim(sp.state_code)),
				sp.acres,
                                convert( numeric(13,10),
                                         ISNULL( sp.hs_pct , 100) ) 
			from shared_prop_value as sp with(nolock)
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
				upper(rtrim(sp.shared_cad_code)),
				upper(rtrim(sp.record_type)),
				isnull(sp.shared_value, 0),
				upper(rtrim(sp.ag_use_code)),
				isnull(sp.ag_use_value, 0),
				convert(
					bit,
					case sp.homesite_flag
						when 'T' then 1
						else 0
					end
				),
				upper(rtrim(sp.state_code)),
				sp.acres,
                                convert( numeric(13,10),
                                         ISNULL( sp.hs_pct, 100 ) ) 
			from shared_prop_value as sp with(nolock)
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

