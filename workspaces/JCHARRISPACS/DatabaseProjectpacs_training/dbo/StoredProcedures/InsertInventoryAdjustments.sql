
CREATE PROCEDURE InsertInventoryAdjustments
@input_yr	numeric(4,0)

AS

--Declare stored procedure variables
declare @land_state_cd	varchar(10)
declare @land_adj_code 	varchar(10)
declare @land_adj_desc	varchar(50)
declare @imp_state_cd	varchar(10)
declare @imp_adj_code	varchar(10)
declare @imp_adj_desc	varchar(50)
declare @prop_id	int
declare @sup_num	int
declare @sale_id	int
declare @count		int

--Declare land_detail cursor variables
declare @land_seg_id		int
declare @next_land_adj_id	int

--Declare imprv cursor variables
declare @imprv_id		int
declare @next_imp_adj_id	int

--Initialize stored procedure variables
select @land_state_cd	= 'O1'
select @land_adj_code 	= 'O1VAC'
select @land_adj_desc	= 'O1VAC'
select @imp_state_cd	= 'O1'
select @imp_adj_code 	= 'O1IMP'
select @imp_adj_desc	= 'O1IMP'
select @count		= 0

--First, check to see if @land_adj_code exists in the land_adj_type table; Also check to see
--if @imp_adj_code exists in the imprv_adj table...
if not exists(select * from land_adj_type where land_adj_type_cd = @land_adj_code)
begin
	--Add the @land_adj_cd because it doesn't exist...
	insert into land_adj_type
	(
		land_adj_type_cd,
		land_adj_type_desc,
		land_adj_type_usage,
		land_adj_type_amt,
		land_adj_type_pct
	)
	values
	(
		@land_adj_code,
		@land_adj_desc,
		'P',
		0,
		100
	)
end

if not exists(select * from land_adj_type where land_adj_type_cd = @land_adj_code)
begin
	--Add the @land_adj_cd because it doesn't exist...
	insert into land_adj_type
	(
		land_adj_type_cd,
		land_adj_type_desc,
		land_adj_type_usage,
		land_adj_type_amt,
		land_adj_type_pct
	)
	values
	(
		@imp_adj_code,
		@imp_adj_desc,
		'P',
		0,
		100
	)
end

if not exists (select * from imprv_adj_type where imprv_adj_type_cd = @imp_adj_code)
begin
	--Add the @imp_adj_code because it doesn't exist...
	insert into imprv_adj_type
	(
		imprv_adj_type_cd,
		imprv_adj_type_desc,
		imprv_adj_type_usage,
		imprv_adj_type_amt,
		imprv_adj_type_pct
	)
	values
	(
		@imp_adj_code,
		@imp_adj_desc,
		'P',
		0,
		100
	)
end

--Loop through all the land_details with a state_cd of @land_state_cd and add an adjustment of @land_adj_code
DECLARE LAND_DETAIL SCROLL CURSOR FOR
select land_detail.prop_id,
land_detail.sup_num,
land_detail.sale_id,
land_detail.land_seg_id
from land_detail, prop_supp_assoc
where land_detail.prop_id 	= prop_supp_assoc.prop_id
and   land_detail.sup_num 	= prop_supp_assoc.sup_num
and   land_detail.prop_val_yr 	= prop_supp_assoc.owner_tax_yr
and   land_detail.prop_val_yr 	= @input_yr
and   land_detail.state_cd 	= @land_state_cd

OPEN LAND_DETAIL
FETCH NEXT FROM LAND_DETAIL into @prop_id, @sup_num, @sale_id, @land_seg_id

while (@@FETCH_STATUS = 0)
begin
	--First, get the @next_land_adj_id value
	exec dbo.GetUniqueID 'land_adj', @next_land_adj_id output, 1, 0

	--If there are improvements on the property, then insert a land_adj_type of @imp_adj_code...
	if exists (select * from imprv
		   where imprv.prop_id = @prop_id
		   and   imprv.prop_val_yr = @input_yr
		   and   imprv.sup_num = @sup_num
		   and   imprv.sale_id = @sale_id)
	begin
		if not exists (select * from land_adj
				where prop_id 		= @prop_id
				and prop_val_yr 	= @input_yr
				and sup_num 		= @sup_num
				and sale_id 		= @sale_id
				and land_seg_id 	= @land_seg_id
				and land_seg_adj_type 	= @imp_adj_code)
		begin
			insert into land_adj
			(
				prop_id,
				prop_val_yr,
				land_seg_id,
				land_seg_adj_seq,
				sup_num,
				sale_id,
				land_value,
				land_seg_adj_dt,
				land_seg_adj_type,
				land_seg_adj_desc,
				land_seg_adj_cd,
				land_seg_adj_pc
			)
			values
			(
				@prop_id,
				@input_yr,
				@land_seg_id,
				@next_land_adj_id,
				@sup_num,
				@sale_id,
				0,
				GetDate(),
				@imp_adj_code,
				null,
				null,
				null
			)
			
			select @count = @count + 1
		end
	end
	else
	begin
		--There are no improvements on the property, so therefore the land is 'vacant'
		--and an adjustment of @land_adj_code is added...
		if not exists (select * from land_adj
				where prop_id 		= @prop_id
				and prop_val_yr 	= @input_yr
				and sup_num 		= @sup_num
				and sale_id 		= @sale_id
				and land_seg_id 	= @land_seg_id
				and land_seg_adj_type 	= @land_adj_code)
		begin
			insert into land_adj
			(
				prop_id,
				prop_val_yr,
				land_seg_id,
				land_seg_adj_seq,
				sup_num,
				sale_id,
				land_value,
				land_seg_adj_dt,
				land_seg_adj_type,
				land_seg_adj_desc,
				land_seg_adj_cd,
				land_seg_adj_pc
			)
			values
			(
				@prop_id,
				@input_yr,
				@land_seg_id,
				@next_land_adj_id,
				@sup_num,
				@sale_id,
				0,
				GetDate(),
				@land_adj_code,
				null,
				null,
				null
			)

			select @count = @count + 1
		end
	end

	FETCH NEXT FROM LAND_DETAIL into @prop_id, @sup_num, @sale_id, @land_seg_id
end

CLOSE LAND_DETAIL
DEALLOCATE LAND_DETAIL

--Loop through all the imprv with a imprv_state_cd of @imp_state_cd and add an adjustment of @imp_adj_code
DECLARE IMPRV SCROLL CURSOR FOR
select imprv.prop_id,
imprv.sup_num,
imprv.sale_id,
imprv.imprv_id
from imprv, prop_supp_assoc
where imprv.prop_id 	= prop_supp_assoc.prop_id
and   imprv.sup_num 	= prop_supp_assoc.sup_num
and   imprv.prop_val_yr = prop_supp_assoc.owner_tax_yr
and   imprv.prop_val_yr = @input_yr
and   imprv.imprv_state_cd = @imp_state_cd

OPEN IMPRV
FETCH NEXT FROM IMPRV into @prop_id, @sup_num, @sale_id, @imprv_id

while (@@FETCH_STATUS = 0)
begin
	--First, get the @next_imp_adj_id value
	exec dbo.GetUniqueID 'imprv_adj', @next_imp_adj_id output, 1, 0

	--Now add the adjustment
	if not exists (select * from imprv_adj
			where prop_id 		= @prop_id
			and prop_val_yr 	= @input_yr
			and sup_num 		= @sup_num
			and sale_id 		= @sale_id
			and imprv_id 		= @imprv_id
			and imprv_adj_type_cd 	= @imp_adj_code)
	begin
		insert into imprv_adj
		(
			prop_id,
			prop_val_yr,
			imprv_id,
			imprv_adj_seq,
			sale_id,
			sup_num,
			imprv_adj_type_cd,
			imprv_adj_desc,
			imprv_adj_pc,
			imprv_adj_amt
		)
		values
		(
			@prop_id,
			@input_yr,
			@imprv_id,
			@next_imp_adj_id,
			@sale_id,
			@sup_num,
			@imp_adj_code,
			null,
			null,
			null
		)

		select @count = @count + 1

	end

	FETCH NEXT FROM IMPRV into @prop_id, @sup_num, @sale_id, @imprv_id
end

CLOSE IMPRV
DEALLOCATE IMPRV

select NUMBER_OF_ADJUSTMENTS_INSERTED = @count

GO

