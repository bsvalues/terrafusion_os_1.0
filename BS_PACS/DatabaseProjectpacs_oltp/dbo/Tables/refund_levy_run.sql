CREATE TABLE [dbo].[refund_levy_run] (
    [refund_levy_run_id]    INT          NOT NULL,
    [year]                  NUMERIC (4)  NOT NULL,
    [refund_levy_config_id] INT          NOT NULL,
    [refund_levy_desc]      VARCHAR (30) NOT NULL,
    [refund_begin_dt]       DATETIME     DEFAULT (getdate()) NOT NULL,
    [refund_end_dt]         DATETIME     DEFAULT (getdate()) NOT NULL,
    [status_cd]             VARCHAR (10) NOT NULL,
    [create_dt]             DATETIME     DEFAULT (getdate()) NOT NULL,
    [created_by_id]         INT          NOT NULL,
    [accepted_dt]           DATETIME     NULL,
    [accepted_by_id]        INT          NOT NULL,
    [cancelled_by_dt]       DATETIME     NULL,
    [cancelled_by_id]       INT          NULL,
    [calc_adref]            BIT          NULL,
    CONSTRAINT [PK_refund_levy_run] PRIMARY KEY CLUSTERED ([refund_levy_run_id] ASC),
    CONSTRAINT [FK_refund_levy_config_id3] FOREIGN KEY ([refund_levy_config_id]) REFERENCES [dbo].[refund_levy_config] ([refund_levy_config_id]) ON DELETE CASCADE
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Calculate Adjusted Refund Levy Amount', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'refund_levy_run', @level2type = N'COLUMN', @level2name = N'calc_adref';


GO

