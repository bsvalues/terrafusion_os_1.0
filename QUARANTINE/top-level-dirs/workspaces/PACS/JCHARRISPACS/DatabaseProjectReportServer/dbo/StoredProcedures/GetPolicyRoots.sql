CREATE PROCEDURE [dbo].[GetPolicyRoots]
AS
SELECT
    [Path],
    [Type]
FROM
    [Catalog]
WHERE
    [PolicyRoot] = 1

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetPolicyRoots] TO [RSExecRole]
    AS [dbo];


GO

