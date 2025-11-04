
create procedure RecalcSelectLandHistory
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSaleID int = 0
as

	if ( @lPacsUserID != 0 )
	begin
			select
				ld.prop_id,
				convert(smallint, ld.prop_val_yr),
				convert(smallint, ld.sup_num),
				convert(
					bit,
					case ld.land_seg_homesite
						when 'T' then 1
						else 0
					end
				),
				isnull(ld.land_seg_mkt_val, 0),
				convert(smallint, isnull(ld.effective_tax_year, 0)),
				ld.land_seg_id
			from #recalc_history_supp_assoc as rsa with(nolock)
			join land_detail as ld with(nolock) on
				ld.prop_val_yr = rsa.prop_val_yr and
				ld.sup_num = rsa.sup_num and
				ld.sale_id = @lSaleID and
				ld.prop_id = rsa.prop_id
			order by
				ld.prop_id asc,
				ld.prop_val_yr asc,
				ld.sup_num asc,
				ld.land_seg_id asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				psa.prop_id,
				convert(smallint, psa.owner_tax_yr),
				convert(smallint, psa.sup_num),
				convert(
					bit,
					case ld.land_seg_homesite
						when 'T' then 1
						else 0
					end
				),
				isnull(ld.land_seg_mkt_val, 0),
				convert(smallint, isnull(ld.effective_tax_year, 0)),
				ld.land_seg_id
			from prop_supp_assoc as psa with(nolock)
			join land_detail as ld with(nolock) on
				psa.owner_tax_yr = ld.prop_val_yr and
				psa.sup_num = ld.sup_num and
				ld.sale_id = @lSaleID and
				psa.prop_id = ld.prop_id
			where
				psa.owner_tax_yr < @lYear and
				psa.owner_tax_yr >= (@lYear - 3)
			order by
				psa.prop_id asc,
				psa.owner_tax_yr asc,
				psa.sup_num asc,
				ld.land_seg_id asc
		end
		else
		begin
			select
				psa.prop_id,
				convert(smallint, psa.owner_tax_yr),
				convert(smallint, psa.sup_num),
				convert(
					bit,
					case ld.land_seg_homesite
						when 'T' then 1
						else 0
					end
				),
				isnull(ld.land_seg_mkt_val, 0),
				convert(smallint, isnull(ld.effective_tax_year, 0)),
				ld.land_seg_id
			from prop_supp_assoc as psa with(nolock)
			join land_detail as ld with(nolock) on
				psa.owner_tax_yr = ld.prop_val_yr and
				psa.sup_num = ld.sup_num and
				ld.sale_id = @lSaleID and
				psa.prop_id = ld.prop_id
			where
				psa.owner_tax_yr < @lYear and
				psa.owner_tax_yr >= (@lYear - 3) and
				psa.prop_id = @lPropID
			order by
				psa.prop_id asc,
				psa.owner_tax_yr asc,
				psa.sup_num asc,
				ld.land_seg_id asc
		end
	end

	return( @@rowcount )

GO

