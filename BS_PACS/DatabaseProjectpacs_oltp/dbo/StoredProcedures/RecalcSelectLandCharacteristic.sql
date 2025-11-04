
create procedure RecalcSelectLandCharacteristic
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int = 0
as

	if ( @lPacsUserID != 0 )
	begin
			select
				ldc.prop_id,
				convert(smallint, ldc.prop_val_yr),
				convert(smallint, ldc.sup_num),
				ldc.land_seg_id,
				upper(rtrim(ldc.characteristic_cd)),
				upper(rtrim(ldc.determinant_cd)),
				isnull(ldc.[override], 0)
			from #recalc_prop_list as rpl with(nolock)
			join land_detail_characteristic as ldc with(nolock) on
				rpl.prop_id = ldc.prop_id and
				rpl.sup_yr = ldc.prop_val_yr and
				rpl.sup_num = ldc.sup_num and
				ldc.sale_id = @lSaleID
			order by 1 asc, 2 asc, 3 asc, 4 asc, 5 asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				ldc.prop_id,
				convert(smallint, ldc.prop_val_yr),
				convert(smallint, ldc.sup_num),
				ldc.land_seg_id,
				upper(rtrim(ldc.characteristic_cd)),
				upper(rtrim(ldc.determinant_cd)),
				isnull(ldc.[override], 0)
			from land_detail_characteristic as ldc with(nolock)
			where
				ldc.prop_val_yr = @lYear and
				ldc.sup_num = @lSupNum and
				ldc.sale_id = @lSaleID
			order by 1 asc, 2 asc, 3 asc, 4 asc, 5 asc
		end
		else
		begin
			select
				ldc.prop_id,
				convert(smallint, ldc.prop_val_yr),
				convert(smallint, ldc.sup_num),
				ldc.land_seg_id,
				upper(rtrim(ldc.characteristic_cd)),
				upper(rtrim(ldc.determinant_cd)),
				isnull(ldc.[override], 0)
			from land_detail_characteristic as ldc with(nolock)
			where
				ldc.prop_id = @lPropID and
				ldc.prop_val_yr = @lYear and
				ldc.sup_num = @lSupNum and
				ldc.sale_id = @lSaleID
			order by 1 asc, 2 asc, 3 asc, 4 asc, 5 asc
		end
	end

	return( @@rowcount )

GO

