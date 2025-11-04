
CREATE procedure RecalcSelectImprovementAttribute
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int = 0
as

if ( @lPacsUserID != 0 )
	begin
			select
				ia.prop_id,
				convert(smallint, ia.prop_val_yr),
				convert(smallint, ia.sup_num),
				ia.imprv_id,
				ia.imprv_det_id,
				ia.imprv_attr_id,
				ia.i_attr_val_cd,
				isnull(ia.i_attr_unit, 0.00)
			from #recalc_prop_list as rpl with(nolock)
			join imprv_attr as ia with(nolock) on
				rpl.prop_id = ia.prop_id and
				rpl.sup_yr = ia.prop_val_yr and
				rpl.sup_num = ia.sup_num and
				ia.sale_id = @lSaleID
			join attribute_val av with (nolock)
			on av.imprv_attr_val_cd = ia.i_attr_val_cd
			join attribute as a with (nolock)
			on a.imprv_attr_id = av.imprv_attr_id
			where a.imprv_attr_id = 10
			order by
				ia.prop_id asc,
				ia.prop_val_yr asc,
				ia.sup_num asc,
				ia.imprv_id asc,
				ia.imprv_det_id asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				ia.prop_id,
				convert(smallint, ia.prop_val_yr),
				convert(smallint, ia.sup_num),
				ia.imprv_id,
				ia.imprv_det_id,
				ia.imprv_attr_id,
				ia.i_attr_val_cd,
				isnull(ia.i_attr_unit, 0.00)
			from imprv_attr as ia with(nolock)
			join attribute_val av with (nolock)
			on av.imprv_attr_val_cd = ia.i_attr_val_cd
			join attribute as a with (nolock)
			on a.imprv_attr_id = av.imprv_attr_id
			where
				ia.prop_val_yr = @lYear and
				ia.sup_num = @lSupNum and
				ia.sale_id = @lSaleID and
				a.imprv_attr_id = 10
			order by
				ia.prop_id asc,
				ia.prop_val_yr asc,
				ia.sup_num asc,
				ia.imprv_id asc,
				ia.imprv_det_id asc
		end
		else
		begin
			select
				ia.prop_id,
				convert(smallint, ia.prop_val_yr),
				convert(smallint, ia.sup_num),
				ia.imprv_id,
				ia.imprv_det_id,
				ia.imprv_attr_id,
				ia.i_attr_val_cd,
				isnull(ia.i_attr_unit, 0.00)
			from imprv_attr as ia with(nolock)
			join attribute_val av with (nolock)
			on av.imprv_attr_val_cd = ia.i_attr_val_cd
			join attribute as a with (nolock)
			on a.imprv_attr_id = av.imprv_attr_id
			where
				ia.prop_id = @lPropID and
				ia.prop_val_yr = @lYear and
				ia.sup_num = @lSupNum and
				ia.sale_id = @lSaleID and
				a.imprv_attr_id = 10
			order by
				ia.prop_id asc,
				ia.prop_val_yr asc,
				ia.sup_num asc,
				ia.imprv_id asc,
				ia.imprv_det_id asc
		end
	end

	return( @@rowcount )

GO

