
CREATE PROCEDURE dbo.sp_ClearMetaComponents

AS
SET NOCOUNT ON

delete from meta_component_right_assoc
delete from meta_component_level_role
delete from meta_component_level
delete from meta_component_publication
delete from meta_component

GO

