CREATE PROCEDURE [dbo].[GetPolicy]
@ItemName as nvarchar(425),
@AuthType int
AS
SELECT SecData.XmlDescription, Catalog.PolicyRoot , SecData.NtSecDescPrimary, Catalog.Type
FROM Catalog
INNER JOIN Policies ON Catalog.PolicyID = Policies.PolicyID
LEFT OUTER JOIN SecData ON Policies.PolicyID = SecData.PolicyID AND AuthType = @AuthType
WHERE Catalog.Path = @ItemName
AND PolicyFlag = 0

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetPolicy] TO [RSExecRole]
    AS [dbo];


GO

