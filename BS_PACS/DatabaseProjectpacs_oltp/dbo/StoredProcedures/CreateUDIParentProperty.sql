
CREATE procedure CreateUDIParentProperty

	@parent_prop_id int,
	@primary_child_prop_id int,
	@primary_owner_id int,
	@year numeric(4,0),
	@sup_num int,
	@retain_group_codes bit,
	@ag_application_filed char(1),
	@apply_percentages_to_exemptions char(1),
	@overall_percentage numeric(13,10),
	@percent_type varchar(5),
	@interest_type varchar(5),
	@comment varchar(3000),
	@remarks varchar(3000),
	@auto_build_legal char(1),
	@udi_child bit,
	@group_codes varchar(3000),
	@geo_id varchar(50),
	@ref_id1 varchar(50),
	@ref_id2 varchar(50),
	@legal_desc varchar(255),
	@additional_legal varchar(255),
  @pacs_user_id int
	
as

set nocount on

declare @current_dt datetime
declare @defaultSupCd varchar(6)

-- Create UDI Parent from primary child
exec dbo.CopyPropertyToNewProperty @primary_child_prop_id, @sup_num, @year,
																		@parent_prop_id, @sup_num, @year

set @current_dt = getdate()

select top 1 @defaultSupCd = sup_type_cd
from udi_system_settings
with (nolock)

update property_val
set udi_parent = 'T',
		prop_inactive_dt = @current_dt,
		udi_original_property_id = @primary_child_prop_id,
		sup_action = case when @sup_num > 0 then 'A' else sup_action end,
		sup_cd = case when @sup_num > 0 then @defaultSupCd else sup_cd end,
		sup_dt = case when @sup_num > 0 then @current_dt else sup_dt end
where prop_val_yr = @year
and sup_num = @sup_num
and prop_id = @parent_prop_id

if @retain_group_codes = 1
begin
	exec dbo.CopyGroupCodes @primary_child_prop_id, @parent_prop_id
end


-- Child Property/Owner updates
update property
set prop_cmnt = @comment,
		remarks = @remarks,
		geo_id = @geo_id,
		ref_id1 = @ref_id1,
		ref_id2 = @ref_id2
where prop_id = @primary_child_prop_id

update owner
set udi_child_prop_id = null,
		percent_type = @percent_type,
		pct_ownership = @overall_percentage
where owner_tax_yr = @year
and sup_num = @sup_num
and prop_id = @primary_child_prop_id
and owner_id = @primary_owner_id

update property_val
set udi_parent_prop_id = @parent_prop_id,
		udi_parent = null,
		udi_status = null,
		prop_inactive_dt = null,
		auto_build_legal = @auto_build_legal,
		udi_child_legal_desc = @udi_child,
		legal_desc = @legal_desc,
		legal_desc_2 = @additional_legal
where prop_val_yr = @year
and sup_num = @sup_num
and prop_id = @primary_child_prop_id

delete from prop_group_assoc
where prop_id = @primary_child_prop_id

set @group_codes = '''' + @group_codes + ''''
set @group_codes = replace(@group_codes, ',', ''',''')

declare @sql varchar(4000)
set @sql = 'insert prop_group_assoc '
set @sql = @sql + '(prop_id, prop_group_cd, create_dt, create_id) '
set @sql = @sql + 'select ' + convert(varchar(20), @primary_child_prop_id) + ', group_cd, '
set @sql = @sql + 'getdate(), ' + convert(varchar(10), @pacs_user_id) + ' '
set @sql = @sql + 'from prop_group_code with (nolock) '
set @sql = @sql + 'where group_cd in (' + @group_codes + ')'
exec (@sql)


-- More parent updates

exec dbo.CopyOwnerToNewProperty @primary_owner_id, @primary_child_prop_id, @sup_num, @year,
																@parent_prop_id, @sup_num, @year

update owner
set udi_child_prop_id = @primary_child_prop_id,
		ag_app_filed = @ag_application_filed,
		apply_pct_exemptions = @apply_percentages_to_exemptions,
		pct_ownership = @overall_percentage,
		percent_type = @percent_type,
		type_of_int = @interest_type
where owner_tax_yr = @year
and sup_num = @sup_num
and prop_id = @parent_prop_id
and owner_id = @primary_owner_id

exec dbo.MoveSegmentsWithReplaceOnNewProperty @primary_child_prop_id, @parent_prop_id, @year,
																							@sup_num, @primary_owner_id

GO

