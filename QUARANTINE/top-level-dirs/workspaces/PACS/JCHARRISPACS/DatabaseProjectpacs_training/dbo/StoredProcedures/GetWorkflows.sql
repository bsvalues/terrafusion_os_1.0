
CREATE PROCEDURE [dbo].[GetWorkflows]	@WorkflowInstanceId			uniqueidentifier = NULL
										,@TypeFullName				nvarchar(128) = NULL
										,@AssemblyFullName			nvarchar(256) = NULL
										,@WorkflowStatusId			tinyint = NULL
										,@StatusMinDateTime			datetime = NULL
										,@StatusMaxDateTime			datetime = NULL
										,@TrackingDataItems					ntext = NULL
AS
 BEGIN
	SET NOCOUNT ON

	declare @localized_string_GetWorkflows_Failed_InvalidStatus nvarchar(256)
	set @localized_string_GetWorkflows_Failed_InvalidStatus = N'@WorkflowStatusId must be 0, 1, 2 or 3.'

	declare @localized_string_GetWorkflows_Failed_FailedXml nvarchar(256)
	set @localized_string_GetWorkflows_Failed_FailedXml = N'Failed calling sp_xml_preparedocument.'

	declare @localized_string_GetWorkflows_Failed_InvalidDateTime nvarchar(256)
	set @localized_string_GetWorkflows_Failed_InvalidDateTime = N'@StatusMaxDateTime and @StatusMinDateTime must both be non null.'

	declare @localized_string_GetWorkflows_Failed_InvalidType nvarchar(256)
	set @localized_string_GetWorkflows_Failed_InvalidType = N'@TypeFullName and @AssemblyFullName must both be non null.'


	DECLARE @idoc int, @typeId int, @ret int, @error_desc nvarchar(256)

	IF ( ( @StatusMinDateTime IS NOT NULL AND @StatusMaxDateTime IS NULL ) OR ( @StatusMaxDateTime IS NOT NULL AND @StatusMinDateTime IS NULL ) )
	 BEGIN
			SET @error_desc = @localized_string_GetWorkflows_Failed_InvalidDateTime
			GOTO FAILED
	 END

	IF ( ( @TypeFullName IS NOT NULL AND @AssemblyFullName IS NULL ) OR ( @AssemblyFullName IS NOT NULL AND @TypeFullName IS NULL ) )
	 BEGIN
			SET @error_desc = @localized_string_GetWorkflows_Failed_InvalidType
			GOTO FAILED
	 END


	IF @TrackingDataItems IS NOT NULL AND datalength( @TrackingDataItems ) > 0
	 BEGIN
		EXEC @ret = sp_xml_preparedocument @idoc OUTPUT, @TrackingDataItems

		IF @@ERROR <> 0 OR @ret <> 0
		 BEGIN
			SET @error_desc = @localized_string_GetWorkflows_Failed_FailedXml
			GOTO FAILED
		 END
	 END

	IF @AssemblyFullName IS NOT NULL AND @TypeFullName IS NOT NULl
	 BEGIN
		EXEC LookupTypeId @TypeFullName=@TypeFullName, @AssemblyFullName = @AssemblyFullName, @TypeId = @typeId OUTPUT
		-- If we didn't find anything we don't have to run the query
		IF @typeId IS NULL
		 BEGIN
			SET @ret = 0
			GOTO DONE
		 END
	 END

	IF @TrackingDataItems IS NOT NULL
	 BEGIN

		IF OBJECT_ID('[tempdb].[dbo].[#TrackingDataItems]') IS NOT NULL
		 BEGIN
			DROP TABLE [#TrackingDataItems]
		 END		

		CREATE TABLE [#TrackingDataItems] (	
				[QualifiedName] 	nvarchar(128) COLLATE database_default,
				[FieldName] 		nvarchar(256) COLLATE database_default,
				[DataValue]			nvarchar(512) COLLATE database_default NULL
		)

		INSERT		[#TrackingDataItems]
		SELECT 		[QualifiedName]
					,[FieldName]
					,[DataValue]
		FROM		OPENXML ( @idoc, '/TrackingDataItems/TrackingDataItem',2) WITH
		            (
							[QualifiedName] nvarchar(128),
		                  	[FieldName] 	nvarchar(256),
							[DataValue]	nvarchar(512)
					)

		CREATE NONCLUSTERED INDEX [idx_TrackingDataItems_QualifiedName] ON [#TrackingDataItems]([QualifiedName])
		CREATE NONCLUSTERED INDEX [idx_TrackingDataItems_FieldName] ON [#TrackingDataItems]([FieldName])
		CREATE NONCLUSTERED INDEX [idx_TrackingDataItems_DataValue] ON [#TrackingDataItems]([DataValue])
	 END

	DECLARE @query nvarchar(4000)

	SELECT @query = '
	SELECT 			''CurrentEventTimeStamp'' = GetUTCDate()
					,[wi].[WorkflowInstanceId]
					,[wi].[WorkflowInstanceInternalId]
					,[wi].[InitializedDateTime]
					,[wi].[CallerInstanceId]
					,''WorkflowStatus'' = 
					CASE
						WHEN [wie].[TrackingWorkflowEventId] IS NULL	THEN cast(4 as int) /* No events tracked - all we know is that it was created */
						WHEN [wie].[TrackingWorkflowEventId] = 0 		THEN cast(4 as int) /* Created */
						WHEN [wie].[TrackingWorkflowEventId] = 1 		THEN cast(1 as int) /* Completed */
						WHEN [wie].[TrackingWorkflowEventId] = 3 		THEN cast(2 as int) /* Suspended */
						WHEN [wie].[TrackingWorkflowEventId] = 9 		THEN cast(3 as int) /* Terminated */
						ELSE cast(0 as int) /* Running */
					END
					,CASE
						WHEN [t].[IsInstanceType] = 0 THEN [t].[TypeFullName]
						ELSE NULL
					END
					,CASE
						WHEN [t].[IsInstanceType] = 0 THEN [t].[AssemblyFullName]
						ELSE NULL
					END
	FROM			[vw_WorkflowInstance] [wi]
	INNER JOIN		[dbo].[vw_Type] [t]
	ON				[wi].[WorkflowTypeId] = [t].[TypeId]
	LEFT OUTER JOIN	[dbo].[vw_WorkflowInstanceEvent] [wie]
	ON				[wi].[WorkflowInstanceInternalId] = [wie].[WorkflowInstanceInternalId] 
	WHERE			( [wie].[WorkflowInstanceEventId] = 
						( 
							SELECT  max([WorkflowInstanceEventId])
				            FROM  	[dbo].[vw_WorkflowInstanceEvent] [wie2]
				            WHERE  	[wie2].[WorkflowInstanceInternalId] = [wie].[WorkflowInstanceInternalId]
							AND		[wie2].[TrackingWorkflowEventId] NOT IN ( 5, 6, 7 ) -- Persisted, Unloaded, Loaded
						)
					OR [wie].[EventOrder] IS NULL ) -- Profile might not track instance events '

	IF @WorkflowInstanceId IS NOT NULL
	 BEGIN
		SELECT @query = @query + '
	AND				[wi].[WorkflowInstanceId] = ''' + cast( @WorkflowInstanceId as char(36) ) + ''''
	 END

	IF @typeId IS NOT NULL
	 BEGIN
		SELECT @query = @query + '
	AND				[wi].[WorkflowTypeId] = ' + cast( @typeId as varchar ) + ' '
	 END

	IF @WorkflowStatusId IS NOT NULL
	 BEGIN
		SELECT @query = @query + '
	AND				( [wie].[TrackingWorkflowEventId] in ( '
		IF @WorkflowStatusId = 0 /* Running */
			SELECT @query = @query + cast( 2 as char(1) ) + ', ' + cast( 4 as char(1) ) + ', ' + cast( 8 as char(1) ) + ', ' + cast( 10 as char(2) ) + ', ' + cast( 11 as char(2) ) + ', ' + cast( 12 as char(2) ) + ' ) '
		ELSE IF @WorkflowStatusId = 1 /* Completed */
			SELECT @query = @query + cast( 1 as char(1) ) + ' ) '
		ELSE IF @WorkflowStatusId = 2 /* Suspended */
			SELECT @query = @query + cast( 3 as char(1) ) + ' ) '
		ELSE IF @WorkflowStatusId = 3 /* Terminated */
			SELECT @query = @query + cast( 9 as char(1) ) + ' ) '
		ELSE IF @WorkflowStatusId = 4 /* Created */
			SELECT @query = @query + cast( 0 as char(1) ) + ' )  OR [wie].[TrackingWorkflowEventId] IS NULL ' -- Not tracking workflow events
		ELSE
		 BEGIN
			SET @error_desc = @localized_string_GetWorkflows_Failed_InvalidStatus
			GOTO FAILED
		 END
		
		SELECT @query = @query + ' ) '
		IF @StatusMinDateTime IS NOT NULL
		 BEGIN
			--
			-- Don't use the db date time in this case
			-- It would be weird to the client to request 12:00-11:59 
			-- and get 11:59 from the previous day because time of the event
			-- and the time the batch was written split their query start or end datetime			
			SELECT @query = @query + '
	AND				[wie].[EventDateTime] BETWEEN convert(datetime,''' + convert( nvarchar(32), @StatusMinDateTime, 121 ) + ''',121) AND convert(datetime,''' + convert( nvarchar(32), @StatusMaxDateTime, 121 ) + ''',121) '
		 END
	 END

	IF @TrackingDataItems IS NOT NULL
	 BEGIN
		SELECT @query = @query + '
		AND			[wi].[WorkflowInstanceInternalId] IN
					(
						SELECT		[wi2].[WorkflowInstanceInternalId]
						FROM		[vw_WorkflowInstance] [wi2]
						INNER JOIN	[dbo].[vw_ActivityInstance] [ai]
						ON			[wi2].[WorkflowInstanceInternalId] = [ai].[WorkflowInstanceInternalId]
						INNER JOIN	[dbo].[vw_ActivityExecutionStatusEvent] [ase]
						ON			[ai].[ActivityInstanceId] = [ase].[ActivityInstanceId]
						INNER JOIN	[dbo].[vw_TrackingDataItem] [a]
						ON			[ase].[WorkflowInstanceInternalId] = [a].[WorkflowInstanceInternalId]
						AND			[ase].[ActivityExecutionStatusEventId] = [a].[EventId]
						AND			[a].[EventTypeId] = ''a''
						INNER JOIN	[#TrackingDataItems] [art]
						ON			[a].[FieldName] = [art].[FieldName]
						AND			[ai].[QualifiedName] = [art].[QualifiedName]
						AND			( [a].[Data_Str] = [art].[DataValue] '

		-- The null comparison is expensive as the OR IS NULL clause will prevent index use
		-- Only add it if we are given null as a search value
		IF EXISTS ( SELECT 1 FROM [#TrackingDataItems] WHERE [DataValue] IS NULL )
		 BEGIN
			SELECT @query = @query + '
									OR 
									( [a].[Data_Str] IS NULL AND [art].[DataValue] IS NULL )
			 '
		 END

		SELECT @query = @query + '
		 ) )'
	 END


	--print @query
	EXEC( @query )

	SET @ret = 0
	GOTO DONE	

FAILED:
	RAISERROR( @error_desc, 16, -1 )

	SET @ret = -1
	GOTO DONE

DONE:
	IF @TrackingDataItems IS NOT NULL AND datalength( @TrackingDataItems ) > 0 AND @idoc IS NOT NULL
	 BEGIN
		EXEC sp_xml_removedocument @idoc
	 END

	RETURN @ret

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetWorkflows] TO [tracking_reader]
    AS [dbo];


GO

