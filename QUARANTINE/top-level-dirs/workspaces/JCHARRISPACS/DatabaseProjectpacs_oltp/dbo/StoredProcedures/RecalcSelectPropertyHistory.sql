
create procedure RecalcSelectPropertyHistory
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0)
as

	if ( @lPacsUserID != 0 )
	begin
			select
				pv.prop_id,
				convert(smallint, pv.prop_val_yr),
				convert(smallint, pv.sup_num),
				isnull(pv.land_hstd_val, 0),
				isnull(pv.imprv_hstd_val, 0),
				isnull(pv.ten_percent_cap, 0),
				isnull(pv.hscap_prevhsval, 0),
				isnull(pv.hscap_newhsval, 0),
				convert(
					bit,
					case pv.hscap_override_prevhsval_flag
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case pv.hscap_override_newhsval_flag
						when 'T' then 1
						else 0
					end
				)
			from #recalc_history_supp_assoc as rsa with(nolock)
			join property_val as pv with(nolock) on
				pv.prop_val_yr = rsa.prop_val_yr and
				pv.sup_num = rsa.sup_num and
				pv.prop_id = rsa.prop_id
			order by
				pv.prop_id asc,
				pv.prop_val_yr asc,
				pv.sup_num asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				psa.prop_id,
				convert(smallint, psa.owner_tax_yr),
				convert(smallint, psa.sup_num),
				isnull(pv.land_hstd_val, 0),
				isnull(pv.imprv_hstd_val, 0),
				isnull(pv.ten_percent_cap, 0),
				isnull(pv.hscap_prevhsval, 0),
				isnull(pv.hscap_newhsval, 0),
				convert(
					bit,
					case pv.hscap_override_prevhsval_flag
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case pv.hscap_override_newhsval_flag
						when 'T' then 1
						else 0
					end
				)
			from prop_supp_assoc as psa with(nolock)
			join property_val as pv with(nolock) on
				psa.owner_tax_yr = pv.prop_val_yr and
				psa.sup_num = pv.sup_num and
				psa.prop_id = pv.prop_id
			where
				psa.owner_tax_yr < @lYear and
				psa.owner_tax_yr >= (@lYear - 3) and
				(pv.prop_inactive_dt is null or pv.udi_parent = 'T')
			order by
				psa.prop_id asc,
				psa.owner_tax_yr asc,
				psa.sup_num asc
		end
		else
		begin
			select
				psa.prop_id,
				convert(smallint, psa.owner_tax_yr),
				convert(smallint, psa.sup_num),
				isnull(pv.land_hstd_val, 0),
				isnull(pv.imprv_hstd_val, 0),
				isnull(pv.ten_percent_cap, 0),
				isnull(pv.hscap_prevhsval, 0),
				isnull(pv.hscap_newhsval, 0),
				convert(
					bit,
					case pv.hscap_override_prevhsval_flag
						when 'T' then 1
						else 0
					end
				),
				convert(
					bit,
					case pv.hscap_override_newhsval_flag
						when 'T' then 1
						else 0
					end
				)
			from prop_supp_assoc as psa with(nolock)
			join property_val as pv with(nolock) on
				psa.owner_tax_yr = pv.prop_val_yr and
				psa.sup_num = pv.sup_num and
				psa.prop_id = pv.prop_id
			where
				psa.prop_id = @lPropID and
				psa.owner_tax_yr < @lYear and
				psa.owner_tax_yr >= (@lYear - 3)
			order by
				psa.prop_id asc,
				psa.owner_tax_yr asc,
				psa.sup_num asc
		end
	end

	return( @@rowcount )

GO

