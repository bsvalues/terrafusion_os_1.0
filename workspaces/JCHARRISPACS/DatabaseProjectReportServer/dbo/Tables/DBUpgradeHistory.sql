CREATE TABLE [dbo].[DBUpgradeHistory] (
    [UpgradeID] BIGINT         IDENTITY (1, 1) NOT NULL,
    [DbVersion] NVARCHAR (25)  NULL,
    [User]      NVARCHAR (128) DEFAULT (suser_sname()) NULL,
    [DateTime]  DATETIME       DEFAULT (getdate()) NULL,
    CONSTRAINT [PK_DBUpgradeHistory] PRIMARY KEY CLUSTERED ([UpgradeID] DESC)
);


GO

GRANT UPDATE
    ON OBJECT::[dbo].[DBUpgradeHistory] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[DBUpgradeHistory] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[DBUpgradeHistory] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[DBUpgradeHistory] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[DBUpgradeHistory] TO [RSExecRole]
    AS [dbo];


GO

