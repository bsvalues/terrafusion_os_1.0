
CREATE PROCEDURE [dbo].[SetWorkflowInstanceEndDateTime]	@WorkflowInstanceInternalId	bigint, @EndDateTime datetime
AS
 BEGIN
	SET NOCOUNT ON

	SET TRANSACTION ISOLATION LEVEL READ COMMITTED
		
	DECLARE @error			int
			,@rowcount		int
			,@error_desc	nvarchar(256)
			,@ret			int

	declare @localized_string_SetWorkflowInstanceEndDateTime_Failed nvarchar(256)
	set @localized_string_SetWorkflowInstanceEndDateTime_Failed = N'SetWorkflowInstanceEndDateTime failed'

	-- Use a server timestamp to avoid races between hosts on machines with out of sync local times
	-- This would race and end up trying to copy records into a read-only partition
	UPDATE	[dbo].[WorkflowInstance] SET [EndDateTime] = @EndDateTime, [DbEndDateTime] = getutcdate() WHERE [WorkflowInstanceInternalId] = @WorkflowInstanceInternalId

	SELECT @error = @@ERROR

	IF @error IS NULL OR @error <> 0
	 BEGIN
		SELECT @error_desc = @localized_string_SetWorkflowInstanceEndDateTime_Failed
		GOTO FAILED
	 END

	SET @ret = 0
	GOTO DONE

FAILED:
	RAISERROR( @error_desc, 16, -1 )

	SET @ret = -1
	GOTO DONE

DONE:
	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[SetWorkflowInstanceEndDateTime] TO [tracking_writer]
    AS [dbo];


GO

