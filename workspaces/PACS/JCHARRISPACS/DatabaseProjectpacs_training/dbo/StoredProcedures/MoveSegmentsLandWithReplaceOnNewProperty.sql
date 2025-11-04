

create procedure MoveSegmentsLandWithReplaceOnNewProperty
	@input_from_prop_id int,
	@input_to_prop_id int,
	@input_year numeric(4,0),
	@input_sup_num int,
	@input_owner_id int
as



delete
	land_owner_assoc
where
	prop_id = @input_to_prop_id
and	prop_val_yr = @input_year
and	sup_num = @input_sup_num


delete
	land_adj
where
	prop_id = @input_to_prop_id
and	prop_val_yr = @input_year
and	sup_num = @input_sup_num


delete
	land_exemption_assoc
where
	prop_id = @input_to_prop_id
and	prop_val_yr = @input_year
and	sup_num = @input_sup_num
and	owner_id = @input_owner_id


delete
	land_entity_assoc
where
	prop_id = @input_to_prop_id
and	prop_val_yr = @input_year
and	sup_num = @input_sup_num


delete
	land_detail
where
	prop_id = @input_to_prop_id
and	prop_val_yr = @input_year
and	sup_num = @input_sup_num




declare @sale_id int
declare curSubLayers insensitive cursor
for
	select distinct sale_id
	from land_detail
	where
		prop_val_yr = @input_year and
		sup_num = @input_sup_num and
		prop_id = @input_from_prop_id
for read only

open curSubLayers

fetch next from curSubLayers into @sale_id
while ( @@fetch_status = 0 )
begin

	exec dbo.LayerCopyLand
		-- From
		@input_year,
		@input_sup_num,
		@sale_id,
		@input_from_prop_id,
		-- To
		@input_year,
		@input_sup_num,
		@sale_id,
		@input_to_prop_id,

		0, -- Assign new IDs
		null, -- All land segments
		0, 0, 0, -- Skip entity/exemption/owner assoc
		@input_owner_id -- Specific owner id (from and to) on exemption/owner assoc

	fetch next from curSubLayers into @sale_id
end

close curSubLayers
deallocate curSubLayers




delete
	land_owner_assoc
where
	prop_id = @input_from_prop_id
and	prop_val_yr = @input_year
and	sup_num = @input_sup_num
and	owner_id = @input_owner_id


delete
	land_adj
where
	prop_id = @input_from_prop_id
and	prop_val_yr = @input_year
and	sup_num = @input_sup_num


delete
	land_exemption_assoc
where
	prop_id = @input_from_prop_id
and	prop_val_yr = @input_year
and	sup_num = @input_sup_num
and	owner_id = @input_owner_id


delete
	land_entity_assoc
where
	prop_id = @input_from_prop_id
and	prop_val_yr = @input_year
and	sup_num = @input_sup_num


delete
	land_detail
where
	prop_id = @input_from_prop_id
and	prop_val_yr = @input_year
and	sup_num = @input_sup_num

GO

