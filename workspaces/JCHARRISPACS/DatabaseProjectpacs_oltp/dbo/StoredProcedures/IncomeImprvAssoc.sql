
create procedure IncomeImprvAssoc

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
		from income_imprv_assoc
		where income_yr = @year
		and sup_num = @sup_num
		and income_id = @income_id
	end
	else
	begin
		select @num_rows = count(income_id)
		from income_imprv_assoc as iia
		with (nolock)
		where income_yr = @year
		and sup_num = @sup_num
		and income_id = @income_id

		-- this is the first time, so default all to included
		if @num_rows = 0
		begin
			insert income_imprv_assoc
			(income_id, sup_num, income_yr, prop_id, imprv_id, included, [value])
			
			select @income_id, @sup_num, @year, @prop_id, i.imprv_id, 1, i.imprv_val
			from imprv as i
			with (nolock)
			where i.prop_val_yr = @year
			and i.sup_num = @sup_num
			and i.prop_id = @prop_id
			and i.sale_id = 0
		end
		else
		begin
			-- update value here if not static_grid
			update income_imprv_assoc
			set [value] = i.imprv_val
			from income_imprv_assoc as iia
			join imprv as i
			with (nolock)
			on iia.income_yr = i.prop_val_yr
			and iia.sup_num = i.sup_num
			and iia.prop_id = i.prop_id
			and iia.imprv_id = i.imprv_id
			and i.sale_id = 0
			where iia.income_yr = @year
			and iia.sup_num = @sup_num
			and iia.income_id = @income_id

			-- now insert any new improvements that weren't there initially.
			insert income_imprv_assoc
			(income_id, sup_num, income_yr, prop_id, imprv_id, included, [value])

			select @income_id, @sup_num, @year, @prop_id, i.imprv_id, 0, i.imprv_val
			from imprv as i
			with (nolock)
			left outer join income_imprv_assoc as iia
			with (nolock)
			on i.prop_val_yr = iia.income_yr
			and i.sup_num = iia.sup_num
			and i.prop_id = iia.prop_id
			and i.imprv_id = iia.imprv_id
			and iia.income_id = @income_id
			where i.prop_val_yr = @year
			and i.sup_num = @sup_num
			and i.prop_id = @prop_id
			and i.sale_id = 0
			and iia.income_id is null
		end
	end

	set nocount off

	

-- ** 'End csp.IncomeImprvAssoc.sql'

GO

