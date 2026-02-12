CREATE TABLE [dbo].[ncoa_import] (
    [run_id]       INT          NOT NULL,
    [status]       VARCHAR (50) NOT NULL,
    [import_dt]    DATETIME     NOT NULL,
    [import_by]    INT          NOT NULL,
    [update_dt]    DATETIME     NULL,
    [update_by]    INT          NULL,
    [pending_dt]   DATETIME     NULL,
    [pending_by]   INT          NULL,
    [cancelled_dt] DATETIME     NULL,
    [cancelled_by] INT          NULL,
    PRIMARY KEY CLUSTERED ([run_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'Date the NCOA import was processed as pending', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ncoa_import', @level2type = N'COLUMN', @level2name = N'pending_dt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'User ID that processed NCOA import as pending', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ncoa_import', @level2type = N'COLUMN', @level2name = N'pending_by';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'Date the NCOA import pending status was cancelled', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ncoa_import', @level2type = N'COLUMN', @level2name = N'cancelled_dt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'User ID that cancelled NCOA import pending status', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ncoa_import', @level2type = N'COLUMN', @level2name = N'cancelled_by';


GO

