
create procedure IncomeLandDetailAssoc

	@year numeric(4,0),
	@sup_num int,
	@income_id int,
	@prop_id int

as

	set nocount on

	declare @num_rows int
	declare @num_properties int

	select @num_properties = count(income_id)
	from income_prop_assoc as ipa
	with (nolock)
	where prop_val_yr = @year
	and sup_num = @sup_num
	and income_id = @income_id

	-- if more than 1 property associated with income, no rows should be returned.
	if @num_properties > 1
	begin
		delete
		from income_land_detail_assoc
		where income_yr = @year
		and sup_num = @sup_num
		and income_id = @income_id
	end
	else
	begin
		select @num_rows = count(income_id)
		from income_land_detail_assoc as iia
		with (nolock)
		where income_yr = @year
		and sup_num = @sup_num
		and income_id = @income_id

		-- this is the first time, so default all to not included
		if @num_rows = 0
		begin
			insert income_land_detail_assoc
			(income_id, sup_num, income_yr, prop_id, land_seg_id, included, [value])
			
			select @income_id, @sup_num, @year, @prop_id, ld.land_seg_id, 0, ld.land_seg_mkt_val
			from land_detail as ld
			with (nolock)
			where ld.prop_val_yr = @year
			and ld.sup_num = @sup_num
			and ld.prop_id = @prop_id
			and ld.sale_id = 0
		end
		else
		begin
			-- update value here if not static_grid
			update income_land_detail_assoc
			set [value] = ld.land_seg_mkt_val
			from income_land_detail_assoc as ilda
			join land_detail as ld
			with (nolock)
			on ilda.income_yr = ld.prop_val_yr
			and ilda.sup_num = ld.sup_num
			and ilda.prop_id = ld.prop_id
			and ilda.land_seg_id = ld.land_seg_id
			and ld.sale_id = 0
			where ilda.income_yr = @year
			and ilda.sup_num = @sup_num
			and ilda.income_id = @income_id

			-- now insert any new land_detail that weren't there initially.
			insert income_land_detail_assoc
			(income_id, sup_num, income_yr, prop_id, land_seg_id, included, [value])

			select @income_id, @sup_num, @year, @prop_id, ld.land_seg_id, 0, ld.land_seg_mkt_val
			from land_detail as ld
			with (nolock)
			left outer join income_land_detail_assoc as ilda
			with (nolock)
			on ld.prop_val_yr = ilda.income_yr
			and ld.sup_num = ilda.sup_num
			and ld.prop_id = ilda.prop_id
			and ld.land_seg_id = ilda.land_seg_id
			and ilda.income_id = @income_id
			where ld.prop_val_yr = @year
			and ld.sup_num = @sup_num
			and ld.prop_id = @prop_id
			and ld.sale_id = 0
			and ilda.income_id is null
		end
	end

	set nocount off


-- ** 'End csp.IncomeLandDetailAssoc.sql'

GO

