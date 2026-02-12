
CREATE PROCEDURE [dbo].[GetUserEventAnnotations]			@WorkflowInstanceInternalId		bigint
															,@BeginDateTime					datetime
															,@EndDateTime					datetime
AS
 BEGIN
	SET NOCOUNT ON

	declare @localized_string_GetUserEventAnnotations_Failed nvarchar(256)
	set @localized_string_GetUserEventAnnotations_Failed = N'GetUserEventAnnotations failed.'

	DECLARE @ret int
	--
	-- Use server datetime in case host machines have out of sync datetimes
	SELECT 		[ea].[EventId]
				,[ea].[Annotation]
				,[ue].[DbEventDateTime]
	FROM		[dbo].[vw_EventAnnotation] [ea]
	INNER JOIN	[dbo].[vw_UserEvent] [ue]
	ON			[ea].[WorkflowInstanceInternalId] = [ue].[WorkflowInstanceInternalId]
	AND			[ea].[EventId] = [ue].[UserEventId]
	WHERE		[ea].[WorkflowInstanceInternalId] = @WorkflowInstanceInternalId
	AND			[ea].[EventTypeId] = 'u'
	AND			[ue].[DbEventDateTime] > @BeginDateTime
	AND			[ue].[DbEventDateTime] <= @EndDateTime
	ORDER BY	[ue].[DbEventDateTime], [ue].[EventOrder]

	IF @@ERROR <> 0
		GOTO FAILED

	SET @ret = 0
	GOTO DONE

FAILED:
	RAISERROR( @localized_string_GetUserEventAnnotations_Failed, 16, -1 )

	SET @ret = -1
	GOTO DONE

DONE:

	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetUserEventAnnotations] TO [tracking_reader]
    AS [dbo];


GO

