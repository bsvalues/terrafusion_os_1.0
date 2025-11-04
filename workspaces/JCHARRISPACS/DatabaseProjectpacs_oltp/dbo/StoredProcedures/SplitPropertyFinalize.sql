
create procedure [dbo].[SplitPropertyFinalize]
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int
as

set nocount on

	-- Begin Table: imprv_exemption_assoc
	delete iea
	from dbo.imprv_exemption_assoc as iea with(rowlock)
	where
		iea.prop_val_yr = @lYear and
		iea.sup_num = @lSupNum and
		iea.sale_id = 0 and
		iea.prop_id = @lPropID
	-- End Table: imprv_exemption_assoc


	-- BeginTable: imprv_owner_assoc
	delete ioa
	from dbo.imprv_owner_assoc as ioa with(rowlock)
	where
		ioa.prop_val_yr = @lYear and
		ioa.sup_num = @lSupNum and
		ioa.sale_id = 0 and
		ioa.prop_id = @lPropID 
	-- End Table: imprv_owner_assoc

	-- Begin Table: land_exemption_assoc
	delete lea
	from dbo.land_exemption_assoc as lea with(rowlock)
	where
		lea.prop_val_yr = @lYear and
		lea.sup_num = @lSupNum and
		lea.sale_id = 0 and
		lea.prop_id = @lPropID 
	-- End Table: land_exemption_assoc


	-- Begin Table: land_owner_assoc
	delete loa
	from dbo.land_owner_assoc as loa with(rowlock)
	where
		loa.prop_val_yr = @lYear and
		loa.sup_num = @lSupNum and
		loa.sale_id = 0 and
		loa.prop_id = @lPropID
	-- End Table: land_owner_assoc

GO

