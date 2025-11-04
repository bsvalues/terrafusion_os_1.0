
CREATE PROCEDURE dbo.sp_AddMetaComponentPublication
		@component_type int,
		@object_type int,
		@sub_type int,
		@role_type int,
		@role int,
		@workflow int,
		@activity int
AS
SET NOCOUNT ON

insert meta_component_publication (component_id, object_type, sub_type, role_type, role, workflow, activity)
values (@component_type, @object_type, @sub_type, @role_type, @role, @workflow, @activity)

GO

