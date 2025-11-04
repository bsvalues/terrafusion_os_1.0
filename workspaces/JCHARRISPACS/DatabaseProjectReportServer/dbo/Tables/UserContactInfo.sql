CREATE TABLE [dbo].[UserContactInfo] (
    [UserID]              UNIQUEIDENTIFIER NOT NULL,
    [DefaultEmailAddress] NVARCHAR (256)   NULL,
    CONSTRAINT [FK_UserContactInfo_Users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

GRANT UPDATE
    ON OBJECT::[dbo].[UserContactInfo] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[UserContactInfo] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[UserContactInfo] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[UserContactInfo] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[UserContactInfo] TO [RSExecRole]
    AS [dbo];


GO

