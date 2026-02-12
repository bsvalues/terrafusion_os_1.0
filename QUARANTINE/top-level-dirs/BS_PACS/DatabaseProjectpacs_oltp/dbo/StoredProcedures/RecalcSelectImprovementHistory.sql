
create procedure RecalcSelectImprovementHistory
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSaleID int = 0
as

	if ( @lPacsUserID != 0 )
	begin
			select
				i.prop_id,
				convert(smallint, i.prop_val_yr),
				convert(smallint, i.sup_num),
				i.imprv_id,
				convert(
					bit,
					case i.imprv_homesite
						when 'Y' then 1
						when 'T' then 1
						else 0
					end
				),
				isnull(i.imp_new_val, 0),
				i.percent_complete,
				i.imp_new_val_override
			from #recalc_history_supp_assoc as rsa with(nolock)
			join imprv as i with(nolock) on
				i.prop_val_yr = rsa.prop_val_yr and
				i.sup_num = rsa.sup_num and
				i.sale_id = @lSaleID and
				i.prop_id = rsa.prop_id
			order by
				i.prop_id asc,
				i.prop_val_yr asc,
				i.sup_num asc,
				i.imprv_id asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				psa.prop_id,
				convert(smallint, psa.owner_tax_yr),
				convert(smallint, psa.sup_num),
				i.imprv_id,
				convert(
					bit,
					case i.imprv_homesite
						when 'Y' then 1
						when 'T' then 1
						else 0
					end
				),
				isnull(i.imp_new_val, 0),
				i.percent_complete,
				i.imp_new_val_override
			from prop_supp_assoc as psa with(nolock)
			join imprv as i with(nolock) on
				psa.owner_tax_yr = i.prop_val_yr and
				psa.sup_num = i.sup_num and
				i.sale_id = @lSaleID and
				psa.prop_id = i.prop_id
			where
				psa.owner_tax_yr < @lYear and
				(
					/* We always need the previous year */
					psa.owner_tax_yr = (@lYear - 1)
					or
					/* Years prior to that we only need those that match this case */
					(
						psa.owner_tax_yr >= (@lYear - 3) and
						i.imp_new_val_override in ('C','D','O')
					)
				)
			order by
				psa.prop_id asc,
				psa.owner_tax_yr asc,
				psa.sup_num asc,
				i.imprv_id asc
		end
		else
		begin
			select
				psa.prop_id,
				convert(smallint, psa.owner_tax_yr),
				convert(smallint, psa.sup_num),
				i.imprv_id,
				convert(
					bit,
					case i.imprv_homesite
						when 'Y' then 1
						when 'T' then 1
						else 0
					end
				),
				isnull(i.imp_new_val, 0),
				i.percent_complete,
				i.imp_new_val_override
			from prop_supp_assoc as psa with(nolock)
			join imprv as i with(nolock) on
				psa.owner_tax_yr = i.prop_val_yr and
				psa.sup_num = i.sup_num and
				i.sale_id = @lSaleID and
				psa.prop_id = i.prop_id
			where
				psa.owner_tax_yr < @lYear and
				psa.prop_id = @lPropID and
				(
					/* We always need the previous year */
					psa.owner_tax_yr = (@lYear - 1)
					or
					/* Years prior to that we only need those that match this case */
					(
						psa.owner_tax_yr >= (@lYear - 3) and
						i.imp_new_val_override in ('C','D','O')
					)
				)
			order by
				psa.prop_id asc,
				psa.owner_tax_yr asc,
				psa.sup_num asc,
				i.imprv_id asc
		end
	end

	return( @@rowcount )

GO

