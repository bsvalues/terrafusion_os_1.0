CREATE PROCEDURE [dbo].[TakeEventFromQueue]
@EventType AS NVARCHAR(520)
AS

-- READPAST hint skip any row being locked (used by other query)
DELETE FROM [Event]
OUTPUT DELETED.*
WHERE EventID IN
(
    SELECT TOP 1 EventID
    FROM [Event] WITH (READPAST)
    WHERE EventType=@EventType
    ORDER BY TimeEntered ASC
)

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[TakeEventFromQueue] TO [RSExecRole]
    AS [dbo];


GO

