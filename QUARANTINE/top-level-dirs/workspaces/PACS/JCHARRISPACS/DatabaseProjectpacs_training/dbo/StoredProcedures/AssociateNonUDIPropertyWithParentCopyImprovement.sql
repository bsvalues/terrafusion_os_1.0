create procedure AssociateNonUDIPropertyWithParentCopyImprovement

	@associate_prop_id int,
	@year numeric(4,0),
	@sup_num int,
	@imprv_id int,
	@parent_prop_id int

as

declare @new_imprv_id int
declare @associate_owner_id int

exec @new_imprv_id = dbo.LayerCopyImprovement
		-- From
		@year,
		@sup_num,
		0,
		@associate_prop_id,
		-- To
		@year,
		@sup_num,
		0,
		@parent_prop_id,

		1, -- Assign new IDs
		@imprv_id, -- One improvement
		null, -- All details on it
		0, 0, 1 -- Skip entity/exemption/owner assoc

select @associate_owner_id = owner_id
from owner
with (nolock)
where owner_tax_yr = @year
and sup_num = @sup_num
and prop_id = @associate_prop_id

insert imprv_owner_assoc
(prop_id, sup_num, prop_val_yr, imprv_id, sale_id, owner_id, owner_pct)
values
(@parent_prop_id, @sup_num, @year, @new_imprv_id, 0, @associate_owner_id, 100)

GO

