




CREATE VIEW dbo.primary_situs_vw
AS
SELECT situs.*
FROM situs
WHERE (primary_situs = 'Y')

GO

