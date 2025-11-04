CREATE PROCEDURE [dbo].[api_ImportPropertyData]
    @ImportType VARCHAR(50),
    @JsonData NVARCHAR(MAX),
    @UserID VARCHAR(50),
    @BatchID UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Generate batch ID if not provided
    IF @BatchID IS NULL
        SET @BatchID = NEWID();
        
    -- Create temp table for validation and staging
    CREATE TABLE #ImportStaging (
        BatchID UNIQUEIDENTIFIER,
        RowID INT IDENTITY(1,1),
        JsonData NVARCHAR(MAX),
        Validated BIT DEFAULT 0,
        ErrorMessage NVARCHAR(MAX)
    );
    
    -- Insert into staging
    INSERT INTO #ImportStaging (BatchID, JsonData)
    SELECT @BatchID, value
    FROM OPENJSON(@JsonData);
    
    -- Validate based on import type
    IF @ImportType = 'PROPERTY_UPDATE'
    BEGIN
        UPDATE #ImportStaging
        SET 
            Validated = 1,
            ErrorMessage = CASE 
                WHEN NOT EXISTS (
                    SELECT 1 
                    FROM property p 
                    WHERE p.prop_id = JSON_VALUE(JsonData, '$.prop_id')
                ) THEN 'Property ID does not exist'
                WHEN ISNUMERIC(JSON_VALUE(JsonData, '$.market')) = 0 
                    THEN 'Invalid market value'
                ELSE NULL
            END;
    END;
    
    -- Begin transaction for actual import
    BEGIN TRY
        BEGIN TRANSACTION;
        
        IF @ImportType = 'PROPERTY_UPDATE'
        BEGIN
            -- Log the import attempt
            INSERT INTO import_log (
                batch_id,
                import_type,
                import_date,
                user_id,
                status
            )
            VALUES (
                @BatchID,
                @ImportType,
                GETDATE(),
                @UserID,
                'PROCESSING'
            );
            
            -- Perform the update for validated records
            UPDATE pv
            SET 
                pv.market = JSON_VALUE(s.JsonData, '$.market'),
                pv.assessed = JSON_VALUE(s.JsonData, '$.assessed'),
                pv.taxable = JSON_VALUE(s.JsonData, '$.taxable'),
                pv.last_updated = GETDATE(),
                pv.last_updated_by = @UserID
            FROM property_val pv
            INNER JOIN #ImportStaging s ON 
                pv.prop_id = JSON_VALUE(s.JsonData, '$.prop_id')
            WHERE s.Validated = 1;
            
            -- Update import log with results
            UPDATE import_log
            SET 
                status = 'COMPLETED',
                records_processed = (SELECT COUNT(*) FROM #ImportStaging WHERE Validated = 1),
                records_failed = (SELECT COUNT(*) FROM #ImportStaging WHERE Validated = 0),
                completion_date = GETDATE()
            WHERE batch_id = @BatchID;
        END;
        
        COMMIT TRANSACTION;
        
        -- Return results
        SELECT 
            BatchID,
            (SELECT COUNT(*) FROM #ImportStaging WHERE Validated = 1) as SuccessCount,
            (SELECT COUNT(*) FROM #ImportStaging WHERE Validated = 0) as FailureCount,
            (
                SELECT ErrorMessage, COUNT(*) as Count
                FROM #ImportStaging 
                WHERE ErrorMessage IS NOT NULL
                GROUP BY ErrorMessage
                FOR JSON PATH
            ) as ErrorSummary;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        -- Log error
        UPDATE import_log
        SET 
            status = 'FAILED',
            error_message = ERROR_MESSAGE()
        WHERE batch_id = @BatchID;
        
        THROW;
    END CATCH;
END;
