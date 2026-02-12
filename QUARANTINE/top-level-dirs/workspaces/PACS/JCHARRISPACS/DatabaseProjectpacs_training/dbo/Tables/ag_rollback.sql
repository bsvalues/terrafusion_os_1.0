CREATE TABLE [dbo].[ag_rollback] (
    [prop_id]               INT          NOT NULL,
    [owner_id]              INT          NOT NULL,
    [ag_rollbk_id]          INT          NOT NULL,
    [chg_in_use_dt]         DATETIME     NULL,
    [ag_rollbk_dt]          DATETIME     NULL,
    [ag_rollbk_stmnt_dt]    DATETIME     NULL,
    [bills_created]         CHAR (1)     NULL,
    [ag_rollbk_type]        VARCHAR (10) NULL,
    [status_cd]             CHAR (5)     NULL,
    [accept_sup_group_id]   INT          NULL,
    [void_sup_group_id]     INT          NULL,
    [exclude_zero_levy]     BIT          NULL,
    [exclude_non_cert_levy] BIT          NULL,
    CONSTRAINT [CPK_ag_rollback] PRIMARY KEY CLUSTERED ([prop_id] ASC, [owner_id] ASC, [ag_rollbk_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_ag_rollback_status_cd] FOREIGN KEY ([status_cd]) REFERENCES [dbo].[ag_rollback_stat_cd] ([status_cd])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Option - exclude levies with a levy rate of zero', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ag_rollback', @level2type = N'COLUMN', @level2name = N'exclude_zero_levy';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Option - exclude levies which are not included in levy certification', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ag_rollback', @level2type = N'COLUMN', @level2name = N'exclude_non_cert_levy';


GO

