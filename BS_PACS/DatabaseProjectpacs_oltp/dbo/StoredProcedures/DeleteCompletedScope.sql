CREATE PROCEDURE [dbo].[DeleteCompletedScope]
@completedScopeID uniqueidentifier
AS
DELETE FROM [dbo].[CompletedScope] WHERE completedScopeID=@completedScopeID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[DeleteCompletedScope] TO [state_persistence_users]
    AS [dbo];


GO

