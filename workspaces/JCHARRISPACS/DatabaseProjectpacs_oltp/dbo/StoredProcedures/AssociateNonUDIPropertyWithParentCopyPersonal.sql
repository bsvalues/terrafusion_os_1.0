create procedure AssociateNonUDIPropertyWithParentCopyPersonal

	@associate_prop_id int,
	@year numeric(4,0),
	@sup_num int,
	@pp_seg_id int,
	@parent_prop_id int

as

declare @new_pp_seg_id int
declare @associate_owner_id int

exec @new_pp_seg_id = dbo.LayerCopyPersonal
		-- From
		@year,
		@sup_num,
		@associate_prop_id,
		-- To
		@year,
		@sup_num,
		@parent_prop_id,

		1, -- Assign new IDs
		@pp_seg_id, -- One segment
		0, 0, 1 -- Skip entity/exemption/owner assoc

select @associate_owner_id = owner_id
from owner
with (nolock)
where owner_tax_yr = @year
and sup_num = @sup_num
and prop_id = @associate_prop_id

insert pers_prop_owner_assoc
(prop_id, sup_num, prop_val_yr, pp_seg_id, sale_id, owner_id, owner_pct)
values
(@parent_prop_id, @sup_num, @year, @new_pp_seg_id, 0, @associate_owner_id, 100)

GO

