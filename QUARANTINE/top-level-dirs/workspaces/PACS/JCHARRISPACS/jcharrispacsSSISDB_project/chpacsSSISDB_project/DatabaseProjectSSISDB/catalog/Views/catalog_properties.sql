
CREATE VIEW [catalog].[catalog_properties]
AS
SELECT     [property_name], 
           [property_value]
FROM       [internal].[catalog_properties]

GO

GRANT SELECT
    ON OBJECT::[catalog].[catalog_properties] TO [ModuleSigner]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[catalog].[catalog_properties] TO PUBLIC
    AS [dbo];


GO

