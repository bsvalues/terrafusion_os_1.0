
create procedure LayerDeleteLand
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int,
	@lPropID int,

	@lLandSegIDDelete int = null
	/*
		Meaning:
			null		Copy all land segments
			not null	A specific land_seg_id to delete
	*/

as

set nocount on

	if ( @lSaleID = 0 )
		exec dbo.LayerDeleteUserTableLand @lYear, @lSupNum, @lPropID, @lLandSegIDDelete
	
	-- Begin Table: property_land_misc_code
	if ( @lLandSegIDDelete is null )
	begin
		delete plmc
		from dbo.property_land_misc_code as plmc with(rowlock)
		where
			plmc.prop_val_yr = @lYear and
			plmc.sup_num = @lSupNum and
			(@lSaleID = 0 or plmc.sale_id = @lSaleID) and
			plmc.prop_id = @lPropID
	end
	-- End Table: property_land_misc_code

	-- Begin Table: land_detail_characteristic
	delete ldc
	from dbo.land_detail_characteristic as ldc with(rowlock)
	where
		ldc.prop_val_yr = @lYear and
		ldc.sup_num = @lSupNum and
		(@lSaleID = 0 or ldc.sale_id = @lSaleID) and
		ldc.prop_id = @lPropID and
		(@lLandSegIDDelete is null or ldc.land_seg_id = @lLandSegIDDelete)
	-- End Table: land_detail_characteristic

	-- Begin Table: land_adj
	delete la
	from dbo.land_adj as la with(rowlock)
	where
		la.prop_val_yr = @lYear and
		la.sup_num = @lSupNum and
		(@lSaleID = 0 or la.sale_id = @lSaleID) and
		la.prop_id = @lPropID and
		(@lLandSegIDDelete is null or la.land_seg_id = @lLandSegIDDelete)
	-- End Table: land_adj


	-- Begin Table: land_entity_assoc
	delete lea
	from dbo.land_entity_assoc as lea with(rowlock)
	where
		lea.prop_val_yr = @lYear and
		lea.sup_num = @lSupNum and
		(@lSaleID = 0 or lea.sale_id = @lSaleID) and
		lea.prop_id = @lPropID and
		(@lLandSegIDDelete is null or lea.land_seg_id = @lLandSegIDDelete)
	-- End Table: imprv_entity_assoc


	-- Begin Table: land_exemption_assoc
	delete lea
	from dbo.land_exemption_assoc as lea with(rowlock)
	where
		lea.prop_val_yr = @lYear and
		lea.sup_num = @lSupNum and
		(@lSaleID = 0 or lea.sale_id = @lSaleID) and
		lea.prop_id = @lPropID and
		(@lLandSegIDDelete is null or lea.land_seg_id = @lLandSegIDDelete)
	-- End Table: land_exemption_assoc


	-- Begin Table: land_owner_assoc
	delete loa
	from dbo.land_owner_assoc as loa with(rowlock)
	where
		loa.prop_val_yr = @lYear and
		loa.sup_num = @lSupNum and
		(@lSaleID = 0 or loa.sale_id = @lSaleID) and
		loa.prop_id = @lPropID and
		(@lLandSegIDDelete is null or loa.land_seg_id = @lLandSegIDDelete)
	-- End Table: land_owner_assoc


	-- Begin Table: land_detail
	delete ld
	from dbo.land_detail as ld with(rowlock)
	where
		ld.prop_val_yr = @lYear and
		ld.sup_num = @lSupNum and
		(@lSaleID = 0 or ld.sale_id = @lSaleID) and
		ld.prop_id = @lPropID and
		(@lLandSegIDDelete is null or ld.land_seg_id = @lLandSegIDDelete)
	-- End Table: land_detail


	return(0)

GO

