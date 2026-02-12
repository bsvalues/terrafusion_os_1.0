CREATE ROLE [ssis_admin]
    AUTHORIZATION [dbo];


GO

ALTER ROLE [ssis_admin] ADD MEMBER [CO\qlue];


GO

ALTER ROLE [ssis_admin] ADD MEMBER [AllSchemaOwner];


GO

