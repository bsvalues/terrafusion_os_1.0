CREATE TABLE [dbo].[Keys] (
    [MachineName]    NVARCHAR (256)   NULL,
    [InstallationID] UNIQUEIDENTIFIER NOT NULL,
    [InstanceName]   NVARCHAR (32)    NULL,
    [Client]         INT              NOT NULL,
    [PublicKey]      IMAGE            NULL,
    [SymmetricKey]   IMAGE            NULL,
    CONSTRAINT [PK_Keys] PRIMARY KEY CLUSTERED ([InstallationID] ASC, [Client] ASC)
);


GO

GRANT UPDATE
    ON OBJECT::[dbo].[Keys] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[Keys] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[Keys] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[Keys] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[Keys] TO [RSExecRole]
    AS [dbo];


GO

