
create procedure RecalcSelectPropertyCharacteristic
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int = 0
as

	if ( @lPacsUserID != 0 )
	begin
			select
				convert(smallint, pca.prop_val_yr),
				convert(smallint, pca.sup_num),
				pca.prop_id,
				upper(rtrim(pca.characteristic_cd)),
				upper(rtrim(pca.attribute_cd))
			from #recalc_prop_list as rpl with(nolock)
			join prop_characteristic_assoc as pca with(nolock) on
				rpl.sup_yr = pca.prop_val_yr and
				rpl.sup_num = pca.sup_num and
				rpl.prop_id = pca.prop_id and
				pca.sale_id = @lSaleID
			order by 3 asc, 1 asc, 2 asc, 4 asc
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				convert(smallint, pca.prop_val_yr),
				convert(smallint, pca.sup_num),
				pca.prop_id,
				upper(rtrim(pca.characteristic_cd)),
				upper(rtrim(pca.attribute_cd))
			from prop_characteristic_assoc as pca with(nolock)
			where
				pca.prop_val_yr = @lYear and
				pca.sup_num = @lSupNum and
				pca.sale_id = @lSaleID
			order by 3 asc, 1 asc, 2 asc, 4 asc
		end
		else
		begin
			select
				convert(smallint, pca.prop_val_yr),
				convert(smallint, pca.sup_num),
				pca.prop_id,
				upper(rtrim(pca.characteristic_cd)),
				upper(rtrim(pca.attribute_cd))
			from prop_characteristic_assoc as pca with(nolock)
			where
				pca.prop_val_yr = @lYear and
				pca.sup_num = @lSupNum and
				pca.prop_id = @lPropID and
				pca.sale_id = @lSaleID
			order by 3 asc, 1 asc, 2 asc, 4 asc
		end
	end

	return( @@rowcount )

GO

