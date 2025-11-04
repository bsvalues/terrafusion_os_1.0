
CREATE PROCEDURE [dbo].[GetActivityEventAnnotations]		@WorkflowInstanceInternalId		bigint
															,@BeginDateTime					datetime
															,@EndDateTime					datetime
AS
 BEGIN
	SET NOCOUNT ON

	declare @localized_string_GetActivityEventAnnotations_Failed nvarchar(256)
	set @localized_string_GetActivityEventAnnotations_Failed = N'GetAcctivityEventAnnotations failed.'

	DECLARE @ret int
	--
	-- Use server datetime in case host machines have out of sync datetimes
	SELECT 		[ea].[EventId]
				,[ea].[Annotation]
				,[ase].[DbEventDateTime]
	FROM		[dbo].[vw_EventAnnotation] [ea]
	INNER JOIN	[dbo].[vw_ActivityExecutionStatusEvent] [ase]
	ON			[ea].[WorkflowInstanceInternalId] = [ase].[WorkflowInstanceInternalId]
	AND			[ea].[EventId] = [ase].[ActivityExecutionStatusEventId]
	WHERE		[ea].[WorkflowInstanceInternalId] = @WorkflowInstanceInternalId
	AND			[ea].[EventTypeId] = 'a'
	AND			[ase].[DbEventDateTime] > @BeginDateTime
	AND			[ase].[DbEventDateTime] <= @EndDateTime
	ORDER BY	[ase].[DbEventDateTime], [ase].[EventOrder]

	IF @@ERROR <> 0
		GOTO FAILED

	SET @ret = 0
	GOTO DONE

FAILED:
	RAISERROR( @localized_string_GetActivityEventAnnotations_Failed, 16, -1 )

	SET @ret = -1
	GOTO DONE

DONE:

	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetActivityEventAnnotations] TO [tracking_reader]
    AS [dbo];


GO

