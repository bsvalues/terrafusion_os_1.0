CREATE PROCEDURE [dbo].[RetrieveNonblockingInstanceStateIds]
@ownerID uniqueidentifier = NULL,
@ownedUntil datetime = NULL,
@now datetime
AS
    SELECT uidInstanceID FROM [dbo].[InstanceState] WITH (TABLOCK,UPDLOCK,HOLDLOCK)
    WHERE blocked=0 AND status<>1 AND status<>3 AND status<>2 -- not blocked and not completed and not terminated and not suspended
 		AND ( ownerID IS NULL OR ownedUntil<GETUTCDATE() )
    if ( @@ROWCOUNT > 0 )
    BEGIN
        -- lock the table entries that are returned
        Update [dbo].[InstanceState]  
        set ownerID = @ownerID,
	    ownedUntil = @ownedUntil
        WHERE blocked=0 AND status<>1 AND status<>3 AND status<>2
 		AND ( ownerID IS NULL OR ownedUntil<GETUTCDATE() )
	
    END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[RetrieveNonblockingInstanceStateIds] TO [state_persistence_users]
    AS [dbo];


GO

