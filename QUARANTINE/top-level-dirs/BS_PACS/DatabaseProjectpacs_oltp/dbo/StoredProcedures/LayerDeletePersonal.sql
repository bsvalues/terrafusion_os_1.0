
create procedure LayerDeletePersonal
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,

	@lPPSegIDDelete int = null
	/*
		Meaning:
			null		Delete all pp segments
			not null	A specific pp_seg_id to delete
	*/
as

set nocount on


	-- Begin Table: pers_prop_sub_seg
	delete ppss
	from dbo.pers_prop_sub_seg as ppss with(rowlock)
	where
		ppss.prop_val_yr = @lYear and
		ppss.sup_num = @lSupNum and
		ppss.prop_id = @lPropID and
		(@lPPSegIDDelete is null or ppss.pp_seg_id = @lPPSegIDDelete)
	-- End Table: pers_prop_sub_seg


	-- Begin Table: pp_seg_sched_assoc
	delete ppssa
	from dbo.pp_seg_sched_assoc as ppssa with(rowlock)
	where
		ppssa.prop_val_yr = @lYear and
		ppssa.sup_num = @lSupNum and
		ppssa.prop_id = @lPropID and
		ppssa.sale_id = 0 and -- Because it is still part of the primary key, can be removed sometime later
		(@lPPSegIDDelete is null or ppssa.pp_seg_id = @lPPSegIDDelete)
	-- End Table: pp_seg_sched_assoc


	-- Begin Table: pers_prop_entity_assoc
	delete ppea
	from dbo.pers_prop_entity_assoc as ppea with(rowlock)
	where
		ppea.prop_val_yr = @lYear and
		ppea.sup_num = @lSupNum and
		ppea.sale_id = 0 and
		ppea.prop_id = @lPropID and
		(@lPPSegIDDelete is null or ppea.pp_seg_id = @lPPSegIDDelete)
	-- End Table: imprv_entity_assoc

	-- Begin Table: pers_prop_exemption_assoc
	delete ppea
	from dbo.pers_prop_exemption_assoc as ppea with(rowlock)
	where
		ppea.prop_val_yr = @lYear and
		ppea.sup_num = @lSupNum and
		ppea.sale_id = 0 and
		ppea.prop_id = @lPropID and
		(@lPPSegIDDelete is null or ppea.pp_seg_id = @lPPSegIDDelete)
	-- End Table: pers_prop_exemption_assoc


	-- Begin Table: pers_prop_owner_assoc
	delete ppoa
	from dbo.pers_prop_owner_assoc as ppoa with(rowlock)
	where
		ppoa.prop_val_yr = @lYear and
		ppoa.sup_num = @lSupNum and
		ppoa.sale_id = 0 and
		ppoa.prop_id = @lPropID and
		(@lPPSegIDDelete is null or ppoa.pp_seg_id = @lPPSegIDDelete)
	-- End Table: pers_prop_owner_assoc


	-- Begin Table: pers_prop_seg
	delete pps
	from dbo.pers_prop_seg as pps with(rowlock)
	where
		pps.prop_val_yr = @lYear and
		pps.sup_num = @lSupNum and
		pps.prop_id = @lPropID and
		(@lPPSegIDDelete is null or pps.pp_seg_id = @lPPSegIDDelete)
	-- End Table: pers_prop_seg


	return(0)

GO

