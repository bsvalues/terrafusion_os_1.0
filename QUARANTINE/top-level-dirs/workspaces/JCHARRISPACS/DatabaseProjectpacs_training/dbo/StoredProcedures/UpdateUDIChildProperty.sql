
create procedure UpdateUDIChildProperty 

	@parent_prop_id int, 
	@child_prop_id int, 
	@year numeric(4,0), 
	@sup_num int,
	@owner_id int, 
	@comment varchar(3000), 
	@remarks varchar(3000), 
	@geo_id varchar(50), 
	@ref_id1 varchar(50),
	@ref_id2 varchar(50), 
	@percent_type varchar(5), 
	@overall_percentage numeric(13,10),
	@auto_build_legal char(1), 
	@udi_child bit, 
	@legal_desc varchar(255),
	@additional_legal varchar(255), 
	@current_dt datetime, 
	@group_codes varchar(3000),
	@pacs_user_id int

as

set nocount on

declare @defaultSupCd varchar(6)

select top 1 @defaultSupCd = sup_type_cd
from udi_system_settings
with (nolock)

-- Child Property/Owner updates
update property
set prop_cmnt = @comment,
		remarks = @remarks,
		geo_id = @geo_id,
		ref_id1 = @ref_id1,
		ref_id2 = @ref_id2
where prop_id = @child_prop_id

update owner
set udi_child_prop_id = null,
		percent_type = @percent_type,
		pct_ownership = @overall_percentage
where owner_tax_yr = @year
and sup_num = @sup_num
and prop_id = @child_prop_id
and owner_id = @owner_id

update property_val
set udi_parent_prop_id = @parent_prop_id,
		udi_parent = null,
		udi_status = null,
		prop_inactive_dt = null,
		auto_build_legal = @auto_build_legal,
		udi_child_legal_desc = @udi_child,
		legal_desc = @legal_desc,
		legal_desc_2 = @additional_legal,
		sup_action = case when @sup_num > 0 then 'A' else sup_action end,
		sup_cd = case when @sup_num > 0 then @defaultSupCd else sup_cd end,
		sup_dt = case when @sup_num > 0 then @current_dt else sup_dt end
where prop_val_yr = @year
and sup_num = @sup_num
and prop_id = @child_prop_id

delete from prop_group_assoc
where prop_id = @child_prop_id

set @group_codes = '''' + @group_codes + ''''
set @group_codes = replace(@group_codes, ',', ''',''')

declare @sql varchar(4000)
set @sql = 'insert prop_group_assoc '
set @sql = @sql + '(prop_id, prop_group_cd, create_dt, create_id) '
set @sql = @sql + 'select ' + convert(varchar(20), @child_prop_id) + ', group_cd, '
set @sql = @sql + 'getdate(), ' + convert(varchar(10), @pacs_user_id) + ' '
set @sql = @sql + 'from prop_group_code with (nolock) '
set @sql = @sql + 'where group_cd in (' + @group_codes + ')'
exec (@sql)

GO

