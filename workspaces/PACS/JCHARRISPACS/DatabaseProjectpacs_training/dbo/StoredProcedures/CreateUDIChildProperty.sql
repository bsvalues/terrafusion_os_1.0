
create procedure CreateUDIChildProperty

	@parent_prop_id int,
	@new_child_prop_id int,
	@child_owner_id int,
	@year numeric(4,0),
	@sup_num int,
	@overall_percentage numeric(13,10),
	@ag_application_filed char(1),
	@apply_pct_exemptions char(1),
	@interest_type varchar(5),
	@percent_type varchar(5),
	@comment varchar(3000),
	@remarks varchar(3000),
	@geo_id varchar(50),
	@ref_id1 varchar(50),
	@ref_id2 varchar(50),
	@auto_build_legal char(1), 
	@udi_child bit, 
	@legal_desc varchar(255),
	@additional_legal varchar(255), 
	@group_codes varchar(3000),
	@pacs_user_id int
	
as

set nocount on

declare @current_dt datetime

set @current_dt = getdate()

insert owner
(owner_id, owner_tax_yr, prop_id, updt_dt, pct_ownership, ag_app_filed,
 apply_pct_exemptions, sup_num, type_of_int, udi_child_prop_id, percent_type)
values
(@child_owner_id, @year, @parent_prop_id, @current_dt, @overall_percentage,
 @ag_application_filed, @apply_pct_exemptions, @sup_num, @interest_type,
 @new_child_prop_id, @percent_type)

exec dbo.CopyPropertyToNewProperty @parent_prop_id, @sup_num, @year,
																		@new_child_prop_id, @sup_num, @year

exec dbo.CopyOwnerToNewProperty @child_owner_id, @parent_prop_id, @sup_num, @year,
																@new_child_prop_id, @sup_num, @year

exec dbo.UpdateUDIChildProperty @parent_prop_id, @new_child_prop_id, @year, @sup_num,
														@child_owner_id, @comment, @remarks, @geo_id, @ref_id1,
														@ref_id2, @percent_type, @overall_percentage,
														@auto_build_legal, @udi_child, @legal_desc,
														@additional_legal, @current_dt, @group_codes, @pacs_user_id

GO

