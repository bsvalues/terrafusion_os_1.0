CREATE PROCEDURE [dbo].[InsertCompletedScope]
@instanceID uniqueidentifier,
@completedScopeID uniqueidentifier,
@state image
As

SET TRANSACTION ISOLATION LEVEL READ COMMITTED
SET NOCOUNT ON

		UPDATE [dbo].[CompletedScope] WITH(ROWLOCK UPDLOCK) 
		    SET state = @state,
		    modified = GETUTCDATE()
		    WHERE completedScopeID=@completedScopeID 

		IF ( @@ROWCOUNT = 0 )
		BEGIN
			--Insert Operation
			INSERT INTO [dbo].[CompletedScope] WITH(ROWLOCK)
			VALUES(@instanceID, @completedScopeID, @state, GETUTCDATE()) 
		END

		RETURN
RETURN

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[InsertCompletedScope] TO [state_persistence_users]
    AS [dbo];


GO

