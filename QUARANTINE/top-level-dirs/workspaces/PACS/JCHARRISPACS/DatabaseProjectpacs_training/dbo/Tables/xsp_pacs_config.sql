CREATE TABLE [dbo].[xsp_pacs_config] (
    [szTAAppSvr]             VARCHAR (64) NOT NULL,
    [lTAAppSvrEnvironmentID] INT          NOT NULL,
    [szParam1]               VARCHAR (64) CONSTRAINT [CDF_xsp_pacs_config_szParam1] DEFAULT ('') NOT NULL,
    [szParam2]               VARCHAR (64) CONSTRAINT [CDF_xsp_pacs_config_szParam2] DEFAULT ('') NOT NULL,
    CONSTRAINT [CPK_xsp_pacs_config] PRIMARY KEY CLUSTERED ([lTAAppSvrEnvironmentID] ASC) WITH (FILLFACTOR = 100)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Parm1', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'xsp_pacs_config', @level2type = N'COLUMN', @level2name = N'szParam1';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Parm2', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'xsp_pacs_config', @level2type = N'COLUMN', @level2name = N'szParam2';


GO

