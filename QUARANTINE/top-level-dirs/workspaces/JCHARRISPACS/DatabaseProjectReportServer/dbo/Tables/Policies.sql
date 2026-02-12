CREATE TABLE [dbo].[Policies] (
    [PolicyID]   UNIQUEIDENTIFIER NOT NULL,
    [PolicyFlag] TINYINT          NULL,
    CONSTRAINT [PK_Policies] PRIMARY KEY CLUSTERED ([PolicyID] ASC)
);


GO

GRANT UPDATE
    ON OBJECT::[dbo].[Policies] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[Policies] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[Policies] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[Policies] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[Policies] TO [RSExecRole]
    AS [dbo];


GO

