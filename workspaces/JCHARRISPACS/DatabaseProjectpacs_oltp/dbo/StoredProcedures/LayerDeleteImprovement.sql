
create procedure LayerDeleteImprovement
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int,
	@lPropID int,
	
	@lImprovIDDelete int = null,
	/*
		Meaning:
			null		Delete all improvements
			not null	A specific imprv_id to delete
	*/
	
	@lImprovDetailIDDelete int = null
	/*
		Meaning
			null		Delete all details
			not null	A specific imprv_det_id to delete - Requires @lImprovIDDelete to be not null
	*/

as


set nocount on


	-- Begin - Validate supported operations
	if ( @lImprovDetailIDDelete is not null )
	begin
		if ( @lImprovIDDelete is null )
		begin
			raiserror('LayerDeleteImprovement - Unsupported operation', 18, 1)
			return(-1)
		end
	end
	-- End - Validate supported operations

-- Begin Table: imprv_detail_cms_addition
	delete idca
	from dbo.imprv_detail_cms_addition as idca with (rowlock)
	where
		idca.prop_val_yr = @lYear and
		idca.sup_num = @lSupNum and
		(@lSaleID = 0 or idca.sale_id = @lSaleID) and
		idca.prop_id = @lPropID and
		(@lImprovIDDelete is null or idca.imprv_id = @lImprovIDDelete) and
		(@lImprovDetailIDDelete is null or idca.imprv_det_id = @lImprovDetailIDDelete)
	-- End Table: imprv_detail_cms_addition
	
	-- Begin Table: imprv_detail_cms_component
	delete idcc
	from dbo.imprv_detail_cms_component as idcc with (rowlock)
	where
		idcc.prop_val_yr = @lYear and
		idcc.sup_num = @lSupNum and
		(@lSaleID = 0 or idcc.sale_id = @lSaleID) and
		idcc.prop_id = @lPropID and
		(@lImprovIDDelete is null or idcc.imprv_id = @lImprovIDDelete) and
		(@lImprovDetailIDDelete is null or idcc.imprv_det_id = @lImprovDetailIDDelete)
	-- End Table: imprv_detail_cms_component
	
	-- Begin Table: imprv_detail_cms_occupancy
	delete idco
	from dbo.imprv_detail_cms_occupancy as idco with (rowlock)
	where
		idco.prop_val_yr = @lYear and
		idco.sup_num = @lSupNum and
		(@lSaleID = 0 or idco.sale_id = @lSaleID) and
		idco.prop_id = @lPropID and
		(@lImprovIDDelete is null or idco.imprv_id = @lImprovIDDelete) and
		(@lImprovDetailIDDelete is null or idco.imprv_det_id = @lImprovDetailIDDelete)
	-- End Table: imprv_detail_cms_occupancy
	
	-- Begin Table: imprv_detail_cms_section
	delete idcs
	from dbo.imprv_detail_cms_section as idcs with (rowlock)
	where
		idcs.prop_val_yr = @lYear and
		idcs.sup_num = @lSupNum and
		(@lSaleID = 0 or idcs.sale_id = @lSaleID) and
		idcs.prop_id = @lPropID and
		(@lImprovIDDelete is null or idcs.imprv_id = @lImprovIDDelete) and
		(@lImprovDetailIDDelete is null or idcs.imprv_det_id = @lImprovDetailIDDelete)
	-- End Table: imprv_detail_cms_section
	
	-- Begin Table: imprv_detail_cms_estimate
	delete idce
	from dbo.imprv_detail_cms_estimate as idce with (rowlock)
	where
		idce.prop_val_yr = @lYear and
		idce.sup_num = @lSupNum and
		(@lSaleID = 0 or idce.sale_id = @lSaleID) and
		idce.prop_id = @lPropID and
		(@lImprovIDDelete is null or idce.imprv_id = @lImprovIDDelete) and
		(@lImprovDetailIDDelete is null or idce.imprv_det_id = @lImprovDetailIDDelete)
	-- End Table: imprv_detail_cms_estimate

	-- Begin Table: imprv_det_adj
	delete ida
	from dbo.imprv_det_adj as ida with(rowlock)
	where
		ida.prop_val_yr = @lYear and
		ida.sup_num = @lSupNum and
		(@lSaleID = 0 or ida.sale_id = @lSaleID) and
		ida.prop_id = @lPropID and
		(@lImprovIDDelete is null or ida.imprv_id = @lImprovIDDelete) and
		(@lImprovDetailIDDelete is null or ida.imprv_det_id = @lImprovDetailIDDelete)
	-- End Table: imprv_det_adj


	-- Begin Table: imprv_attr
	delete ia
	from dbo.imprv_attr as ia with(rowlock)
	where
		ia.prop_val_yr = @lYear and
		ia.sup_num = @lSupNum and
		(@lSaleID = 0 or ia.sale_id = @lSaleID) and
		ia.prop_id = @lPropID and
		(@lImprovIDDelete is null or ia.imprv_id = @lImprovIDDelete) and
		(@lImprovDetailIDDelete is null or ia.imprv_det_id = @lImprovDetailIDDelete)
	-- End Table: imprv_attr


	-- Begin Table: imprv_detail
	delete id
	from dbo.imprv_detail as id with(rowlock)
	where
		id.prop_val_yr = @lYear and
		id.sup_num = @lSupNum and
		(@lSaleID = 0 or id.sale_id = @lSaleID) and
		id.prop_id = @lPropID and
		(@lImprovIDDelete is null or id.imprv_id = @lImprovIDDelete) and
		(@lImprovDetailIDDelete is null or id.imprv_det_id = @lImprovDetailIDDelete)
	-- End Table: imprv_detail


	if ( @lImprovDetailIDDelete is not null )
	begin
		-- Finished since we only deleted a detail
		RETURN(0)
	end


	-- Begin Table: imprv_sketch_note
	delete isn
	from dbo.imprv_sketch_note as isn with(rowlock)
	where
		isn.prop_val_yr = @lYear and
		isn.sup_num = @lSupNum and
		(@lSaleID = 0 or isn.sale_id = @lSaleID) and
		isn.prop_id = @lPropID and
		(@lImprovIDDelete is null or isn.imprv_id = @lImprovIDDelete)
	-- End Table: imprv_sketch_note
	
	-- Begin Table: imprv_sketch
	delete iss
	from dbo.imprv_sketch as iss with(rowlock)
	where
		iss.prop_val_yr = @lYear and
		iss.sup_num = @lSupNum and
		(@lSaleID = 0 or iss.sale_id = @lSaleID) and
		iss.prop_id = @lPropID and
		(@lImprovIDDelete is null or iss.imprv_id = @lImprovIDDelete)
	-- End Table: imprv_sketch


	-- Begin Table: imprv_adj
	delete ia
	from dbo.imprv_adj as ia with(rowlock)
	where
		ia.prop_val_yr = @lYear and
		ia.sup_num = @lSupNum and
		(@lSaleID = 0 or ia.sale_id = @lSaleID) and
		ia.prop_id = @lPropID and
		(@lImprovIDDelete is null or ia.imprv_id = @lImprovIDDelete)
	-- End Table: imprv_adj


	-- Begin Table: imprv_entity_assoc
	delete iea
	from dbo.imprv_entity_assoc as iea with(rowlock)
	where
		iea.prop_val_yr = @lYear and
		iea.sup_num = @lSupNum and
		(@lSaleID = 0 or iea.sale_id = @lSaleID) and
		iea.prop_id = @lPropID and
		(@lImprovIDDelete is null or iea.imprv_id = @lImprovIDDelete)
	-- End Table: imprv_entity_assoc


	-- Begin Table: imprv_exemption_assoc
	delete iea
	from dbo.imprv_exemption_assoc as iea with(rowlock)
	where
		iea.prop_val_yr = @lYear and
		iea.sup_num = @lSupNum and
		(@lSaleID = 0 or iea.sale_id = @lSaleID) and
		iea.prop_id = @lPropID and
		(@lImprovIDDelete is null or iea.imprv_id = @lImprovIDDelete)
	-- End Table: imprv_exemption_assoc


	-- BeginTable: imprv_owner_assoc
	delete ioa
	from dbo.imprv_owner_assoc as ioa with(rowlock)
	where
		ioa.prop_val_yr = @lYear and
		ioa.sup_num = @lSupNum and
		(@lSaleID = 0 or ioa.sale_id = @lSaleID) and
		ioa.prop_id = @lPropID and
		(@lImprovIDDelete is null or ioa.imprv_id = @lImprovIDDelete)
	-- End Table: imprv_owner_assoc

	-- Begin Delete pacs_image (for sketches)
		declare @location varchar(255)
		declare @cmd varchar(512)
		
		declare imprv_images cursor fast_forward for
		select location from pacs_image
		where ref_type in ('SKTCH', 'PI')
		and ref_id = @lPropID
		and 1 = case when @lImprovIDDelete is null then 1 when ref_id1 = @lImprovIDDelete then 1 else 0 end
		and ref_id2 = @lSupNum
		and ref_year = @lYear

		open imprv_images
		fetch next from imprv_images into @location

		while @@fetch_status = 0
		begin
			set @cmd = 'del "' + @location + '"'
			exec xp_cmdshell @cmd
			fetch next from imprv_images into @location
		end

		close imprv_images
		deallocate imprv_images

		delete pacs_image
		where ref_type in ('SKTCH', 'PI')
		and ref_id = @lPropID
		and 1 = case when @lImprovIDDelete is null then 1 when ref_id1 = @lImprovIDDelete then 1 else 0 end
		and ref_id2 = @lSupNum
		and ref_year = @lYear
	-- Begin Delete pacs_image (for sketches)


	-- Begin Table: imprv
	delete i
	from dbo.imprv as i with(rowlock)
	where
		i.prop_val_yr = @lYear and
		i.sup_num = @lSupNum and
		(@lSaleID = 0 or i.sale_id = @lSaleID) and
		i.prop_id = @lPropID and
		(@lImprovIDDelete is null or i.imprv_id = @lImprovIDDelete)
	-- End Table: imprv


	return(0)

GO

