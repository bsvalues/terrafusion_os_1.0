
create procedure UnlockPropertyValues
	@prop_id int,
	@year numeric(4,0),

	@result_flag bit output,
	@error_text varchar(max) output,

	@user_id int = 0

as

set nocount on

EXEC SetMachineLogChanges 1, @user_id

-- initialize
set @result_flag = 1
set @error_text = 'Property values were successfully unlocked.'

-- get property data
declare @prop_type_cd char(5)
declare @sup_num int
declare @has_locked_values bit

select @prop_type_cd = prop_type_cd
from property with(nolock)
where prop_id = @prop_id

set @sup_num = 0

select @has_locked_values = has_locked_values
from property_val with(nolock)
where prop_id = @prop_id
and prop_val_yr = @year
and sup_num = @sup_num

-- validation
if @result_flag = 1
begin
	set @result_flag = 0

	if @prop_type_cd is null or @has_locked_values is null
		set @error_text = 'The property does not exist'
	else if not (@prop_type_cd = 'R' or @prop_type_cd = 'MH' or @prop_type_cd = 'P')
		set @error_text = 'Only real, mobile home, and personal properties can have locked values.'
	else if @has_locked_values = 0
		set @error_text = 'The property does not have locked values.'
	else
		set @result_flag = 1
end

-- unlock improvements
if @prop_type_cd = 'R' or @prop_type_cd = 'MH'
begin
	update imprv
	set locked_val = null
	where prop_id = @prop_id
	and prop_val_yr = @year
	and sup_num = @sup_num
end

-- unlock land
if @prop_type_cd = 'R'
begin
	update land_detail
	set locked_val = null,
		locked_ag_val = null,
		locked_ag_use_cd = null
	where prop_id = @prop_id
	and prop_val_yr = @year
	and sup_num = @sup_num
end

-- unlock personal property segments
if @prop_type_cd = 'P'
begin
	update pers_prop_seg
	set locked_val = null
	where prop_id = @prop_id
	and prop_val_yr = @year
	and sup_num = @sup_num
end

-- clear the lock flag
update property_val
set has_locked_values = 0
where prop_id = @prop_id
and prop_val_yr = @year
and sup_num = @sup_num

GO

