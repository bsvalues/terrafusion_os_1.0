CREATE PROCEDURE [dbo].[UpdateComment]
@Text nvarchar(2048),
@CommentID bigint
AS
BEGIN
    UPDATE
        [Comments]
    SET
        [Text]=@Text,
        [ModifiedDate]=GETDATE()
    WHERE
        [CommentID]=@CommentID
END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[UpdateComment] TO [RSExecRole]
    AS [dbo];


GO

