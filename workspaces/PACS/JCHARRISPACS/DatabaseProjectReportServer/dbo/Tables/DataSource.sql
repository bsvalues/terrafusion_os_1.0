CREATE TABLE [dbo].[DataSource] (
    [DSID]                                 UNIQUEIDENTIFIER NOT NULL,
    [ItemID]                               UNIQUEIDENTIFIER NULL,
    [SubscriptionID]                       UNIQUEIDENTIFIER NULL,
    [Name]                                 NVARCHAR (260)   NULL,
    [Extension]                            NVARCHAR (260)   NULL,
    [Link]                                 UNIQUEIDENTIFIER NULL,
    [CredentialRetrieval]                  INT              NULL,
    [Prompt]                               NTEXT            NULL,
    [ConnectionString]                     IMAGE            NULL,
    [OriginalConnectionString]             IMAGE            NULL,
    [OriginalConnectStringExpressionBased] BIT              NULL,
    [UserName]                             IMAGE            NULL,
    [Password]                             IMAGE            NULL,
    [Flags]                                INT              NULL,
    [Version]                              INT              NOT NULL,
    [DSIDNum]                              BIGINT           IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [PK_DataSource] PRIMARY KEY CLUSTERED ([DSID] ASC),
    CONSTRAINT [FK_DataSourceItemID] FOREIGN KEY ([ItemID]) REFERENCES [dbo].[Catalog] ([ItemID]),
    UNIQUE NONCLUSTERED ([DSIDNum] ASC)
);


GO
EXECUTE sp_tableoption @TableNamePattern = N'[dbo].[DataSource]', @OptionName = N'text in row', @OptionValue = N'256';


GO

CREATE NONCLUSTERED INDEX [IX_DataSourceItemID]
    ON [dbo].[DataSource]([ItemID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_DataSourceSubscriptionID]
    ON [dbo].[DataSource]([SubscriptionID] ASC);


GO

GRANT SELECT
    ON OBJECT::[dbo].[DataSource] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[DataSource] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[DataSource] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[DataSource] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[DataSource] TO [RSExecRole]
    AS [dbo];


GO

