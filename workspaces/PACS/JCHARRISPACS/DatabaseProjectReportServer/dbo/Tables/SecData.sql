CREATE TABLE [dbo].[SecData] (
    [SecDataID]          UNIQUEIDENTIFIER NOT NULL,
    [PolicyID]           UNIQUEIDENTIFIER NOT NULL,
    [AuthType]           INT              NOT NULL,
    [XmlDescription]     NTEXT            NOT NULL,
    [NtSecDescPrimary]   IMAGE            NOT NULL,
    [NtSecDescSecondary] NTEXT            NULL,
    [NtSecDescState]     INT              CONSTRAINT [DF_SecData_NtSecDescState] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [PK_SecData] PRIMARY KEY NONCLUSTERED ([SecDataID] ASC),
    CONSTRAINT [FK_SecDataPolicyID] FOREIGN KEY ([PolicyID]) REFERENCES [dbo].[Policies] ([PolicyID]) ON DELETE CASCADE
);


GO
EXECUTE sp_tableoption @TableNamePattern = N'[dbo].[SecData]', @OptionName = N'text in row', @OptionValue = N'256';


GO

CREATE UNIQUE CLUSTERED INDEX [IX_SecData]
    ON [dbo].[SecData]([PolicyID] ASC, [AuthType] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_SecData_NtSecDescState]
    ON [dbo].[SecData]([NtSecDescState] ASC);


GO

GRANT DELETE
    ON OBJECT::[dbo].[SecData] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[SecData] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[SecData] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[SecData] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[SecData] TO [RSExecRole]
    AS [dbo];


GO

