
CREATE VIEW [dbo].[vw_Type]
AS
SELECT		[TypeId]
			,[TypeFullName]
			,[AssemblyFullName]
			,[IsInstanceType]
FROM		[dbo].[Type]

GO

GRANT SELECT
    ON OBJECT::[dbo].[vw_Type] TO [tracking_reader]
    AS [dbo];


GO

