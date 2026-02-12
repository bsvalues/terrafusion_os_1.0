
CREATE PROCEDURE dbo.sp_AddMetaComponentRights
		@component_id int
		,@component_type int
		,@right_id int
AS
SET NOCOUNT ON

if not exists (select 1 from meta_component_right_assoc where component_id = @component_id and component_type = @component_type and right_id = @right_id)
begin
	insert meta_component_right_assoc (component_id, component_type, right_id)
	values(@component_id, @component_type, @right_id)
end

GO

