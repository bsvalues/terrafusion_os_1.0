CREATE PROCEDURE [dbo].[RetrieveANonblockingInstanceStateId]
@ownerID uniqueidentifier = NULL,
@ownedUntil datetime = NULL,
@uidInstanceID uniqueidentifier = NULL output,
@found bit = NULL output
AS
 BEGIN
		--
		-- Guarantee that no one else grabs this record between the select and update
		SET TRANSACTION ISOLATION LEVEL REPEATABLE READ
		BEGIN TRANSACTION

SET ROWCOUNT 1
		SELECT	@uidInstanceID = uidInstanceID
		FROM	[dbo].[InstanceState] WITH (updlock) 
		WHERE	blocked=0 
		AND	status NOT IN ( 1,2,3 )
 		AND	( ownerID IS NULL OR ownedUntil<GETUTCDATE() )
SET ROWCOUNT 0

		IF @uidInstanceID IS NOT NULL
		 BEGIN
			UPDATE	[dbo].[InstanceState]  
			SET		ownerID = @ownerID,
					ownedUntil = @ownedUntil
			WHERE	uidInstanceID = @uidInstanceID

			SET @found = 1
		 END
		ELSE
		 BEGIN
			SET @found = 0
		 END

		COMMIT TRANSACTION
 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[RetrieveANonblockingInstanceStateId] TO [state_persistence_users]
    AS [dbo];


GO

