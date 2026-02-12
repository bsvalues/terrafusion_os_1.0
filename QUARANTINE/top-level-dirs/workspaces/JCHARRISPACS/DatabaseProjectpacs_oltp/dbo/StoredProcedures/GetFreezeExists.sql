




CREATE procedure GetFreezeExists

@input_type		char(1),
@input_prop_id		int,
@input_owner_id		int,
@input_sup_num		int,
@input_yr		numeric(4),
@input_freeze_exists	bit output

as

if (@input_type = 'P')
begin
	if exists
	(
		select
			*
		from
			prelim_property_freeze with (nolock)
		where
			prop_id = @input_prop_id
		and	owner_id = @input_owner_id
		and	sup_num = @input_sup_num
		and	owner_tax_yr = @input_yr
		and	exmpt_tax_yr = @input_yr
		and	isnull(use_freeze, 'F') = 'T'
	)
	begin
		set @input_freeze_exists = 1
	end
	else
	begin
		set @input_freeze_exists = 0
	end
end
else
begin
	if exists
	(
		select
			*
		from
			property_freeze with (nolock)
		where
			prop_id = @input_prop_id
		and	owner_id = @input_owner_id
		and	sup_num = @input_sup_num
		and	owner_tax_yr = @input_yr
		and	exmpt_tax_yr = @input_yr
		and	isnull(use_freeze, 'F') = 'T'
	)
	begin
		set @input_freeze_exists = 1
	end
	else
	begin
		set @input_freeze_exists = 0
	end
end

GO

