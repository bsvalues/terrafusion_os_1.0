CREATE TABLE [dbo].[ServerParametersInstance] (
    [ServerParametersID] NVARCHAR (32)  NOT NULL,
    [ParentID]           NVARCHAR (32)  NULL,
    [Path]               NVARCHAR (425) NOT NULL,
    [CreateDate]         DATETIME       NOT NULL,
    [ModifiedDate]       DATETIME       NOT NULL,
    [Timeout]            INT            NOT NULL,
    [Expiration]         DATETIME       NOT NULL,
    [ParametersValues]   IMAGE          NOT NULL,
    CONSTRAINT [PK_ServerParametersInstance] PRIMARY KEY CLUSTERED ([ServerParametersID] ASC)
);


GO
EXECUTE sp_tableoption @TableNamePattern = N'[dbo].[ServerParametersInstance]', @OptionName = N'text in row', @OptionValue = N'256';


GO

CREATE NONCLUSTERED INDEX [IX_ServerParametersInstanceExpiration]
    ON [dbo].[ServerParametersInstance]([Expiration] DESC);


GO

