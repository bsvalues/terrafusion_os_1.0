
CREATE PROCEDURE sp_RethrowError 
	@Explanation NVarChar(500) = NULL
AS
BEGIN
		SET NOCOUNT ON;

    -- Return if there is no error information to retrieve.
    IF ERROR_NUMBER() IS NULL
        RETURN;

    DECLARE 
        @ErrorMessage    NVARCHAR(4000),
        @ErrorNumber     INT,
        @ErrorSeverity   INT,
        @ErrorState      INT,
        @ErrorLine       INT,
        @ErrorProcedure  NVARCHAR(200);

    -- Assign variables to error-handling functions that 
    -- capture information for RAISERROR.
    SELECT 
        @ErrorNumber = ERROR_NUMBER(),
        @ErrorSeverity = ERROR_SEVERITY(),
        @ErrorState = ERROR_STATE(),
        @ErrorLine = ERROR_LINE(),
        @ErrorProcedure = ISNULL(ERROR_PROCEDURE(), '-');

    -- Build the message string that will contain original
    -- error information.
    SELECT @ErrorMessage = 
        N'Msg %d, Level %d, State %d, Procedure %s, Line %d, ' + 
            'Message: '+ ERROR_MESSAGE();

		if(@Explanation is Not NULL)
		begin 
			Declare @EOF NVarChar(2);
			Set @EOF = Char(10) --+ Char(13); 

			SET @ErrorMessage = @Explanation + @EOF + 'Original Error:' + @EOF +  @ErrorMessage;
		end

    -- Raise an error: msg_str parameter of RAISERROR will contain
    -- the original error information.
    RAISERROR(
			@ErrorMessage, 
      @ErrorSeverity, 
      0, /*State*/
			--Message Formatting prameters            
      @ErrorNumber,    -- parameter: original error number.
      @ErrorSeverity,  -- parameter: original error severity.
      @ErrorState,     -- parameter: original error state.
      @ErrorProcedure, -- parameter: original error procedure name.
      @ErrorLine       -- parameter: original error line number.
     );

		SET NOCOUNT OFF;
End

GO

