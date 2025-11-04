
create procedure RecalcUpdateLandCharacteristic
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int = 0
as

set nocount on

	if ( @lPacsUserID != 0 )
	begin
		delete land_detail_characteristic
		from land_detail_characteristic as ldc
		join #recalc_prop_list as rpl on
			rpl.sup_yr = ldc.prop_val_yr and
			rpl.sup_num = ldc.sup_num and
			ldc.sale_id = @lSaleID and
			rpl.prop_id = ldc.prop_id
		join characteristic_value_code as cvc on
			cvc.characteristic_cd = ldc.characteristic_cd and
			cvc.push_to_land = 1
		where 
			not exists (
				select pca.prop_id
				from prop_characteristic_assoc as pca
				where pca.prop_id = ldc.prop_id
				and pca.prop_val_yr = ldc.prop_val_yr
				and pca.sup_num = ldc.sup_num
				and pca.characteristic_cd = ldc.characteristic_cd
				and pca.attribute_cd = ldc.determinant_cd
				and pca.sale_id = ldc.sale_id
			) and
			ldc.override = 0 and
			ldc.is_from_property = 1
		
		-- Some may not even exist at the land level, so we need to insert those
		insert land_detail_characteristic (
			prop_val_yr, sup_num, sale_id, prop_id, land_seg_id,
			characteristic_cd, determinant_cd, [override], is_from_property
		)
		select
			ld.prop_val_yr, ld.sup_num, ld.sale_id, ld.prop_id, ld.land_seg_id,
			pca.characteristic_cd, pca.attribute_cd, 0, 1
		from #recalc_prop_list as rpl
		join land_detail as ld on
			rpl.sup_yr = ld.prop_val_yr and
			rpl.sup_num = ld.sup_num and
			rpl.prop_id = ld.prop_id and
			ld.sale_id = @lSaleID
		join prop_characteristic_assoc as pca on
			pca.prop_val_yr = ld.prop_val_yr and
			pca.sup_num = ld.sup_num and
			pca.prop_id = ld.prop_id and
			pca.sale_id = ld.sale_id
		join characteristic_value_code as cvc on
			cvc.characteristic_cd = pca.characteristic_cd and
			cvc.push_to_land = 1
		where
			not exists (
				select ldc.prop_val_yr
				from land_detail_characteristic as ldc
				where
					ldc.prop_val_yr = ld.prop_val_yr and
					ldc.sup_num = ld.sup_num and
					ldc.sale_id = @lSaleID and
					ldc.prop_id = ld.prop_id and
					ldc.land_seg_id = ld.land_seg_id and
					ldc.characteristic_cd = pca.characteristic_cd 
			)
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			delete land_detail_characteristic
				from land_detail_characteristic as ldc
				join characteristic_value_code as cvc on
					cvc.characteristic_cd = ldc.characteristic_cd and
					cvc.push_to_land = 1
				where 
					not exists (
						select pca.prop_id
						from prop_characteristic_assoc as pca
						where pca.prop_id = ldc.prop_id
						and pca.prop_val_yr = ldc.prop_val_yr
						and pca.sup_num = ldc.sup_num
						and pca.sale_id = ldc.sale_id
						and pca.characteristic_cd = ldc.characteristic_cd
						and pca.attribute_cd = ldc.determinant_cd
					) and
					ldc.override = 0 and
					ldc.is_from_property = 1 and
					ldc.prop_val_yr = @lYear and
					ldc.sup_num = @lSupNum and
					ldc.sale_id = @lSaleID
					
		
			-- Some may not even exist at the land level, so we need to insert those
			insert land_detail_characteristic (
				prop_val_yr, sup_num, sale_id, prop_id, land_seg_id,
				characteristic_cd, determinant_cd, [override], is_from_property
			)
			select
				ld.prop_val_yr, ld.sup_num, ld.sale_id, ld.prop_id, ld.land_seg_id,
				pca.characteristic_cd, pca.attribute_cd, 0, 1
			from land_detail as ld
			join prop_characteristic_assoc as pca on
				pca.prop_val_yr = ld.prop_val_yr and
				pca.sup_num = ld.sup_num and
				pca.sale_id = ld.sale_id and
				pca.prop_id = ld.prop_id
			join characteristic_value_code as cvc on
				cvc.characteristic_cd = pca.characteristic_cd and
				cvc.push_to_land = 1
			where
				ld.prop_val_yr = @lYear and
				ld.sup_num = @lSupNum and
				ld.sale_id = @lSaleID and
				not exists (
					select ldc.prop_val_yr
					from land_detail_characteristic as ldc
					where
						ldc.prop_val_yr = ld.prop_val_yr and
						ldc.sup_num = ld.sup_num and
						ldc.sale_id = ld.sale_id and
						ldc.prop_id = ld.prop_id and
						ldc.land_seg_id = ld.land_seg_id and
						ldc.characteristic_cd = pca.characteristic_cd 
				)
		end
		else
		begin
			delete land_detail_characteristic
			from land_detail_characteristic as ldc
			join characteristic_value_code as cvc on
				cvc.characteristic_cd = ldc.characteristic_cd and
				cvc.push_to_land = 1
			where 
				not exists (
					select pca.prop_id
					from prop_characteristic_assoc as pca
					where pca.prop_id = ldc.prop_id
					and pca.prop_val_yr = ldc.prop_val_yr
					and pca.sup_num = ldc.sup_num
					and pca.sale_id = ldc.sale_id
					and pca.characteristic_cd = ldc.characteristic_cd
					and pca.attribute_cd = ldc.determinant_cd
				) and
				ldc.override = 0 and
				ldc.is_from_property = 1 and
				ldc.prop_val_yr = @lYear and
				ldc.sup_num = @lSupNum and
				ldc.sale_id = @lSaleID and
				ldc.prop_id = @lPropID

			
			-- Some may not even exist at the land level, so we need to insert those
			insert land_detail_characteristic (
				prop_val_yr, sup_num, sale_id, prop_id, land_seg_id,
				characteristic_cd, determinant_cd, [override], is_from_property
			)
			select
				ld.prop_val_yr, ld.sup_num, ld.sale_id, ld.prop_id, ld.land_seg_id,
				pca.characteristic_cd, pca.attribute_cd, 0, 1
			from land_detail as ld
			join prop_characteristic_assoc as pca on
				pca.prop_val_yr = ld.prop_val_yr and
				pca.sup_num = ld.sup_num and
				pca.sale_id = ld.sale_id and
				pca.prop_id = ld.prop_id
			join characteristic_value_code as cvc on
				cvc.characteristic_cd = pca.characteristic_cd and
				cvc.push_to_land = 1
			where
				ld.prop_val_yr = @lYear and
				ld.sup_num = @lSupNum and
				ld.sale_id = @lSaleID and
				ld.prop_id = @lPropID and
				not exists (
					select ldc.prop_val_yr
					from land_detail_characteristic as ldc
					where
						ldc.prop_val_yr = ld.prop_val_yr and
						ldc.sup_num = ld.sup_num and
						ldc.sale_id = ld.sale_id and
						ldc.prop_id = ld.prop_id and
						ldc.land_seg_id = ld.land_seg_id and
						ldc.characteristic_cd = pca.characteristic_cd
				)
		end
	end

GO

