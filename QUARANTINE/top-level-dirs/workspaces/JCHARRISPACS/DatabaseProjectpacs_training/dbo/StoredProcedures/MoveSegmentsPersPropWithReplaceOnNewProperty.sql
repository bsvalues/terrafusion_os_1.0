

create procedure MoveSegmentsPersPropWithReplaceOnNewProperty
	@input_from_prop_id int,
	@input_to_prop_id int,
	@input_year numeric(4,0),
	@input_sup_num int,
	@input_owner_id int
as




delete
	pers_prop_owner_assoc
where
	prop_id = @input_to_prop_id
and	prop_val_yr = @input_year
and	sup_num = @input_sup_num
and	owner_id = @input_owner_id


delete
	pers_prop_sub_seg
where
	prop_id = @input_to_prop_id
and	prop_val_yr = @input_year
and	sup_num = @input_sup_num


delete
	pers_prop_exemption_assoc
where
	prop_id = @input_to_prop_id
and	prop_val_yr = @input_year
and	sup_num = @input_sup_num
and	owner_id = @input_owner_id


delete
	pers_prop_entity_assoc
where
	prop_id = @input_to_prop_id
and	prop_val_yr = @input_year
and	sup_num = @input_sup_num


delete
	pers_prop_seg
where
	prop_id = @input_to_prop_id
and	prop_val_yr = @input_year
and	sup_num = @input_sup_num




exec dbo.LayerCopyPersonal
	-- From
	@input_year,
	@input_sup_num,
	@input_from_prop_id,
	-- To
	@input_year,
	@input_sup_num,
	@input_to_prop_id,

	0, -- Assign new IDs
	null, -- All segments
	0, 0, 0, -- Skip entity/exemption/owner assoc
	@input_owner_id -- Specific owner id (from and to) on exemption/owner assoc




delete
	pers_prop_owner_assoc
where
	prop_id = @input_from_prop_id
and	prop_val_yr = @input_year
and	sup_num = @input_sup_num
and	owner_id = @input_owner_id


delete
	pers_prop_sub_seg
where
	prop_id = @input_from_prop_id
and	prop_val_yr = @input_year
and	sup_num = @input_sup_num


delete
	pers_prop_exemption_assoc
where
	prop_id = @input_from_prop_id
and	prop_val_yr = @input_year
and	sup_num = @input_sup_num
and	owner_id = @input_owner_id


delete
	pers_prop_entity_assoc
where
	prop_id = @input_from_prop_id
and	prop_val_yr = @input_year
and	sup_num = @input_sup_num


delete
	pers_prop_seg
where
	prop_id = @input_from_prop_id
and	prop_val_yr = @input_year
and	sup_num = @input_sup_num

GO

