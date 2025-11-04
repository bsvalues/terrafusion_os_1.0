CREATE TABLE [dbo].[ConfigurationInfo] (
    [ConfigInfoID] UNIQUEIDENTIFIER NOT NULL,
    [Name]         NVARCHAR (260)   NOT NULL,
    [Value]        NTEXT            NOT NULL,
    CONSTRAINT [PK_ConfigurationInfo] PRIMARY KEY NONCLUSTERED ([ConfigInfoID] ASC)
);


GO
EXECUTE sp_tableoption @TableNamePattern = N'[dbo].[ConfigurationInfo]', @OptionName = N'text in row', @OptionValue = N'256';


GO

CREATE UNIQUE CLUSTERED INDEX [IX_ConfigurationInfo]
    ON [dbo].[ConfigurationInfo]([Name] ASC);


GO

GRANT DELETE
    ON OBJECT::[dbo].[ConfigurationInfo] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[ConfigurationInfo] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[ConfigurationInfo] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[ConfigurationInfo] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[ConfigurationInfo] TO [RSExecRole]
    AS [dbo];


GO

