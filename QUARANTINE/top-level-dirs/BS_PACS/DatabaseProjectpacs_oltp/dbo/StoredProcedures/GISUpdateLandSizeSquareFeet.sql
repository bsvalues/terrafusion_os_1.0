
create procedure GISUpdateLandSizeSquareFeet

	@prop_id int,
	@year numeric(4,0),
	@sup_num int,
	@land_seg_id int,
	@new_size_square_feet numeric(18,2)

as

set nocount on

update land_detail
set size_square_feet = @new_size_square_feet,
	size_acres = @new_size_square_feet / 43560,
	size_useable_square_feet = @new_size_square_feet,
	size_useable_acres = @new_size_square_feet / 43560
where prop_val_yr = @year
and sup_num = @sup_num
and sale_id = 0
and prop_id = @prop_id
and land_seg_id = @land_seg_id

GO

