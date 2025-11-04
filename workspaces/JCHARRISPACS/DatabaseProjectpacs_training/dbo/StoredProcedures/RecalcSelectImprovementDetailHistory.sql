
create procedure RecalcSelectImprovementDetailHistory
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),	/* The year that is being recalculated, not the prior year we are selecting */
	@lSaleID int = 0
as

	if ( @lPacsUserID != 0 )
	begin
			select
				id.prop_id,
				convert(smallint, id.prop_val_yr),
				convert(smallint, id.sup_num),
				id.imprv_id,
				id.imprv_det_id,
				isnull(id.percent_complete, 100.00),
				convert(
					bit,
					case id.percent_complete_override
						when 'T' then 1
						else 0
					end
				),
				isnull(id.imprv_det_val, 0)
			from #recalc_prop_list as rpl with(nolock)
			join prop_supp_assoc as psa with(nolock) on
				rpl.prop_id = psa.prop_id and
				(rpl.sup_yr - 1) = psa.owner_tax_yr
			join imprv_detail as id with(nolock) on
				rpl.prop_id = id.prop_id and
				(rpl.sup_yr - 1) = id.prop_val_yr and
				psa.sup_num = id.sup_num and
				id.sale_id = @lSaleID
			order by
				id.prop_id asc,
				id.prop_val_yr asc,
				id.sup_num asc,
				id.imprv_id asc,
				id.imprv_det_id asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				id.prop_id,
				convert(smallint, id.prop_val_yr),
				convert(smallint, id.sup_num),
				id.imprv_id,
				id.imprv_det_id,
				isnull(id.percent_complete, 100.00),
				convert(
					bit,
					case id.percent_complete_override
						when 'T' then 1
						else 0
					end
				),
				isnull(id.imprv_det_val, 0)
			from prop_supp_assoc as psa with(nolock)
			join imprv_detail as id with(nolock) on
				psa.prop_id = id.prop_id and
				id.prop_val_yr = (@lYear - 1) and
				psa.sup_num = id.sup_num and
				id.sale_id = @lSaleID
			where
				psa.owner_tax_yr = (@lYear - 1)
			order by
				id.prop_id asc,
				id.prop_val_yr asc,
				id.sup_num asc,
				id.imprv_id asc,
				id.imprv_det_id asc
		end
		else
		begin
			select
				id.prop_id,
				convert(smallint, id.prop_val_yr),
				convert(smallint, id.sup_num),
				id.imprv_id,
				id.imprv_det_id,
				isnull(id.percent_complete, 100.00),
				convert(
					bit,
					case id.percent_complete_override
						when 'T' then 1
						else 0
					end
				),
				isnull(id.imprv_det_val, 0)
			from prop_supp_assoc as psa with(nolock)
			join imprv_detail as id with(nolock) on
				id.prop_id = @lPropID and
				id.prop_val_yr = (@lYear - 1) and
				psa.sup_num = id.sup_num and
				id.sale_id = @lSaleID
			where
				psa.prop_id = @lPropID and
				psa.owner_tax_yr = (@lYear - 1)
			order by
				id.prop_id asc,
				id.prop_val_yr asc,
				id.sup_num asc,
				id.imprv_id asc,
				id.imprv_det_id asc
		end
	end

	return( @@rowcount )

GO

