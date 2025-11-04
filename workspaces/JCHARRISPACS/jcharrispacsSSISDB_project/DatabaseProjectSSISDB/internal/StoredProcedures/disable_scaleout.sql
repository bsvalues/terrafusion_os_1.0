
CREATE PROCEDURE [internal].[disable_scaleout]
AS

BEGIN
SET NOCOUNT ON

BEGIN TRY
	ALTER DATABASE SSISDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE

DECLARE @accountName AS SYSNAME
SET @accountName = N'NT Service\SSISScaleOutMaster150'
DECLARE @strExec NVARCHAR (MAX)
    
	UPDATE [internal].[master_properties] SET [property_value] = '' WHERE [property_name] = 'IS_SCALEOUT_ENABLED'
		
IF (SUSER_SID(@accountName) IS NOT NULL AND EXISTS (SELECT * FROM sys.syslogins WHERE NAME = @accountName))
BEGIN
	SET @strExec = N'Drop LOGIN ' + QUOTENAME(@accountName) 
	EXEC (@strExec)
END
   
	IF EXISTS(SELECT * FROM sys.database_principals where name = 'SSISScaleOutMasterUser150')
		DROP USER SSISScaleOutMasterUser150

	SET @accountName = N'##MS_SSISLogDBWorkerAgentLogin##'
	IF (SUSER_SID(@accountName) IS NOT NULL AND EXISTS (SELECT * FROM sys.syslogins WHERE NAME = @accountName))
	BEGIN
		SET @strExec = N'Drop LOGIN ' + QUOTENAME(@accountName)
		EXEC (@strExec)
END

	IF EXISTS(SELECT * FROM sys.database_principals where name = '##MS_SSISLogDBWorkerAgentUser##')
		DROP USER ##MS_SSISLogDBWorkerAgentUser##

	ALTER DATABASE [SSISDB] SET MULTI_USER WITH ROLLBACK IMMEDIATE
END TRY
BEGIN CATCH
	ALTER DATABASE [SSISDB] SET MULTI_USER WITH ROLLBACK IMMEDIATE
END CATCH
   
END

GO

GRANT EXECUTE
    ON OBJECT::[internal].[disable_scaleout] TO [ssis_admin]
    AS [dbo];


GO

