
create procedure LockPropertyValues
	@prop_id int,
	@year numeric(4,0),
	@imprv_list varchar(max),
	@land_flag bit,

	@result_flag bit output,
	@error_text varchar(max) output,

	@user_id int = 0
as

set nocount on

EXEC SetMachineLogChanges 1, @user_id

-- initialize
set @result_flag = 1
set @error_text = 'Property values were successfully locked.'

-- Extract the list of improvement IDs.
-- If the list string contains ALL, get all improvements for the property.
-- Otherwise, get just those listed.

if object_id('tempdb..#imprv_ids') is not null
begin
	drop table #imprv_ids
end

create table #imprv_ids (id int)

declare @select_imprv varchar(max)
set @select_imprv = 
	'insert #imprv_ids (id)  ' + 
	'select imprv_id from imprv with(nolock)  ' +
	'where prop_id = ' + convert(varchar(max), @prop_id)  + '  ' +
	'and prop_val_yr = ' + convert(varchar(max), @year) + '  ' 

if charindex('all', lower(@imprv_list)) = 0
begin
	set @select_imprv = @select_imprv + 
	'and imprv_id in (' + @imprv_list + ')  '
end

begin try
	exec (@select_imprv)
end try
begin catch
	set @result_flag = 0
	set @error_text = 'The list of improvement IDs is invalid.'
end catch

-- get property data
declare @is_year_certified bit
declare @prop_type_cd char(5)
declare @sup_num int
declare @has_locked_values bit
declare @recalc_flag char(1)
declare @appr_method char(5)
declare @imprv_count int
declare @land_count int
declare @seg_count int

select @is_year_certified = 
	case when certification_dt is not null then 1 else 0 end
from pacs_year with(nolock)
where tax_yr = @year

select @prop_type_cd = prop_type_cd
from property with(nolock)
where prop_id = @prop_id

set @sup_num = 0

select @has_locked_values = has_locked_values,
	@recalc_flag = recalc_flag,
	@appr_method = appr_method
from property_val with(nolock)
where prop_id = @prop_id
and prop_val_yr = @year
and sup_num = @sup_num

select @imprv_count = count(*)
from #imprv_ids

select @land_count = count(*)
from land_detail with(nolock)
where prop_id = @prop_id
and prop_val_yr = @year
and sup_num = @sup_num

select @seg_count = count(*)
from pers_prop_seg with(nolock)
where prop_id = @prop_id
and prop_val_yr = @year
and sup_num = @sup_num

-- validation
if @result_flag = 1
begin
	set @result_flag = 0

	if @is_year_certified = 1
		set @error_text = 'Property values cannot be locked in a certified year'
	else if @year = 0
		set @error_text = 'Property values cannot be locked in a future year layer'
	else if @prop_type_cd is null or @has_locked_values is null
		set @error_text = 'The property does not exist'
	else if not (@prop_type_cd = 'R' or @prop_type_cd = 'MH' or @prop_type_cd = 'P')
		set @error_text = 'Only real, mobile home, and personal properties can have values locked.'
	else if @has_locked_values = 1
		set @error_text = 'The property already has locked values.'
	else if @prop_type_cd = 'R' and @imprv_count = 0 and (@land_flag = 0 or @land_count = 0)
		set @error_text = 'Neither land nor any improvements have been selected to lock.'
	else if @prop_type_cd = 'MH' and @imprv_count = 0
		set @error_text = 'No improvements have been selected to lock.'
	else if @prop_type_cd = 'P' and @seg_count = 0
		set @error_text = 'The property has no segments to lock.'
	--else if @recalc_flag = 'M'
	--	set @error_text = 'The property needs to be recalculated.'
	--else if @recalc_flag = 'E'
	--	set @error_text = 'The property has calculation errors.'
	else
		set @result_flag = 1
end

-- lock improvements
if (@prop_type_cd = 'R' or @prop_type_cd = 'MH') and @imprv_count > 0
begin
	update im
	set locked_val = isnull(case @appr_method
		when 'C' then im.imprv_val
		when 'G' then im.mktappr_val
		when 'I' then im.income_val
		when 'A' then im.arb_val
		when 'D' then im.dist_val
		else 0 end, 0)
	from imprv im with(nolock)
	where im.imprv_id in (select id from #imprv_ids)
	and im.prop_id = @prop_id
	and im.prop_val_yr = @year
	and im.sup_num = @sup_num
end

-- lock land
if @prop_type_cd = 'R' and @land_flag = 1
begin
	update ld
	set locked_val = isnull(case @appr_method
		when 'C' then ld.land_seg_mkt_val
		when 'G' then ld.mktappr_val
		when 'I' then ld.land_seg_mkt_val -- land detail values don't apply to Income, so store this instead
		when 'A' then ld.arb_val
		when 'D' then ld.dist_val
		else 0 end, 0),
	locked_ag_val = case
		when ld.ag_apply = 'T' then ld.ag_val
		else null end,
	locked_ag_use_cd = ld.ag_use_cd
	from land_detail ld with(nolock)
	where ld.prop_id = @prop_id
	and ld.prop_val_yr = @year
	and ld.sup_num = @sup_num
end

-- lock personal property segments
if @prop_type_cd = 'P'
begin
	update pps
	set locked_val = isnull(case @appr_method
		when 'C' then pps.pp_mkt_val
		when 'A' then pps.arb_val
		when 'D' then pps.dist_val
		else 0 end, 0)
	from pers_prop_seg pps with(nolock)
	where pps.prop_id = @prop_id
	and pps.prop_val_yr = @year
	and pps.sup_num = @sup_num
end

-- set the lock flag
update property_val
set has_locked_values = 1
where prop_id = @prop_id
and prop_val_yr = @year
and sup_num = @sup_num

-- cleanup
drop table #imprv_ids

GO

