CREATE PROCEDURE [internal].[master_heartbeat]
AS
BEGIN
	SET NOCOUNT ON
	
	UPDATE [SSISDB].[internal].[master_properties] SET property_value = SYSDATETIMEOFFSET()  WHERE property_name = 'LAST_ONLINE_TIME'
	
END

GO

GRANT EXECUTE
    ON OBJECT::[internal].[master_heartbeat] TO [ssis_admin]
    AS [dbo];


GO

