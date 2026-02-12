CREATE PROCEDURE [internal].[dealwith_expired_tasks]

WITH EXECUTE AS 'AllSchemaOwner'
AS
BEGIN
	SET NOCOUNT ON
	SET XACT_ABORT ON
	
	
    SET TRANSACTION ISOLATION LEVEL SERIALIZABLE
    
    
    
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
		DECLARE @updated_tasks TABLE  
		(  
			TaskId UNIQUEIDENTIFIER,  
			Status INT,
			TaskType INT,
			InputData NVARCHAR(MAX)  
		);  
  
		UPDATE [internal].[tasks]
		SET [LastUpdatedTime]=SYSDATETIMEOFFSET(),
			[Status]=
			CASE 
				WHEN [IsCancelled] = 1 THEN 6
				WHEN [IsCancelled] = 0 AND [MaxExecutedCount] > [ExecutedCount] THEN 1
				ELSE 4
			END,
			[ReadyForDispatchTime]=
			CASE 
				WHEN [IsCancelled] = 0 AND [MaxExecutedCount] > [ExecutedCount] THEN SYSDATETIMEOFFSET()
				ELSE NULL
			END,
			[ExpiredTime] = 
			CASE 
				WHEN [IsCancelled] = 0 AND [MaxExecutedCount] > [ExecutedCount] THEN NULL
				ELSE [ExpiredTime]
			END,
			[WorkerAgentId]=
			CASE 
				WHEN [IsCancelled] = 0 AND [MaxExecutedCount] > [ExecutedCount] THEN NULL
				ELSE [WorkerAgentId]
			END	
		OUTPUT INSERTED.TaskId, INSERTED.Status, INSERTED.TaskType, INSERTED.InputData INTO @updated_tasks
		FROM [internal].[tasks] 
		WHERE [Status] IN (2, 3) AND [ExpiredTime] <= SYSDATETIMEOFFSET()
		
		
		UPDATE [internal].[operations]
		SET [status] = 6, [end_time] = SYSDATETIMEOFFSET()
		WHERE [operation_id] IN (SELECT CONVERT(bigint,[internal].[get_input_value]([InputData], 'execution_id')) FROM @updated_tasks 
		WHERE [TaskType] = 0 AND [Status] = 4)
		
		
		DECLARE @stop_operations TABLE  
		(
			operation_id bigint,
			operation_to_stop_id bigint
		);

		INSERT INTO @stop_operations 
			SELECT CONVERT(bigint,[internal].[get_input_value]([InputData], 'stop_id')), CONVERT(bigint,[internal].[get_input_value]([InputData], 'execution_id')) FROM @updated_tasks 
				WHERE [TaskType] = 0 AND [Status] = 6

		
		UPDATE [internal].[operations]
		SET [status] = 3, [end_time] = SYSDATETIMEOFFSET(), [stopped_by_sid] = [caller_sid] , [stopped_by_name] = [caller_name]
		FROM @stop_operations AS STOP_OP INNER JOIN [internal].[operations] ON STOP_OP.operation_to_stop_id = [internal].[operations].[operation_id]

		
		UPDATE [internal].[operations]
		SET [status] = 7, [end_time] = SYSDATETIMEOFFSET()
		WHERE [operation_id] IN (SELECT operation_id FROM @stop_operations)

		
		
        IF @tran_count = 0
            COMMIT TRANSACTION;                                                                                 
		RETURN 0
	END TRY
	BEGIN CATCH
		
        IF @tran_count = 0 
            ROLLBACK TRANSACTION;
        
        ELSE IF XACT_STATE() <> -1
            ROLLBACK TRANSACTION @savepoint_name;                                                                           
		THROW
	END CATCH
END

GO

GRANT EXECUTE
    ON OBJECT::[internal].[dealwith_expired_tasks] TO [ssis_admin]
    AS [dbo];


GO

