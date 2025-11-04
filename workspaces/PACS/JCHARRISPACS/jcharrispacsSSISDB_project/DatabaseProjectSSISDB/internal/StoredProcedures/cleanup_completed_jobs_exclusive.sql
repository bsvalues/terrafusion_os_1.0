
CREATE PROCEDURE [internal].[cleanup_completed_jobs_exclusive]
	@minutesToKeep    INT = 60                                
WITH EXECUTE AS 'AllSchemaOwner'
AS
BEGIN
	SET NOCOUNT ON
	DECLARE @RC INT
	
    SET TRANSACTION ISOLATION LEVEL REPEATABLE READ
    
    
    
    DECLARE @tran_count INT = @@TRANCOUNT;
    DECLARE @savepoint_name NCHAR(32);
    IF @tran_count > 0
    BEGIN
        SET @savepoint_name = REPLACE(CONVERT(NCHAR(36), NEWID()), N'-', N'');
        SAVE TRANSACTION @savepoint_name;
    END
    ELSE
        BEGIN TRANSACTION;                                                                                      
	BEGIN TRY
		Exec @RC =sp_getapplock @Resource='cleanup_completed_jobs', @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout = 0
		IF (@RC >= 0)
		BEGIN
			EXEC [internal].[cleanup_completed_jobs] @minutesToKeep        
			
        IF @tran_count = 0
            COMMIT TRANSACTION;                                                                                 
		END   
		ELSE BEGIN       
		    
        IF @tran_count = 0 
            ROLLBACK TRANSACTION;
        
        ELSE IF XACT_STATE() <> -1
            ROLLBACK TRANSACTION @savepoint_name;                                                                            
		END
	END TRY
	BEGIN CATCH
		
        IF @tran_count = 0 
            ROLLBACK TRANSACTION;
        
        ELSE IF XACT_STATE() <> -1
            ROLLBACK TRANSACTION @savepoint_name;                                                                                  
		THROW 
	END CATCH
	RETURN @RC
END

GO

