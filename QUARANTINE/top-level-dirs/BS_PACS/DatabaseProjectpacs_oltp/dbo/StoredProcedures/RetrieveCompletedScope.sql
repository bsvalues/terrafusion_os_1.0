CREATE PROCEDURE RetrieveCompletedScope
@completedScopeID uniqueidentifier,
@result int output
AS
BEGIN
    SELECT state FROM [dbo].[CompletedScope] WHERE completedScopeID=@completedScopeID
	set @result = @@ROWCOUNT;
End

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[RetrieveCompletedScope] TO [state_persistence_users]
    AS [dbo];


GO

