CREATE PROCEDURE [dbo].[GetRoles]
@RoleFlags as tinyint = NULL
AS
SELECT
    RoleName,
    Description,
    TaskMask
FROM
    Roles
WHERE
    (@RoleFlags is NULL) OR
    (RoleFlags = @RoleFlags)

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetRoles] TO [RSExecRole]
    AS [dbo];


GO

