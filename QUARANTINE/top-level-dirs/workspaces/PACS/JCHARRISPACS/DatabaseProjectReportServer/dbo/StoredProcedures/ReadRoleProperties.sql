CREATE PROCEDURE [dbo].[ReadRoleProperties]
@RoleName as nvarchar(260)
AS
SELECT Description, TaskMask, RoleFlags FROM Roles WHERE RoleName = @RoleName

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[ReadRoleProperties] TO [RSExecRole]
    AS [dbo];


GO

