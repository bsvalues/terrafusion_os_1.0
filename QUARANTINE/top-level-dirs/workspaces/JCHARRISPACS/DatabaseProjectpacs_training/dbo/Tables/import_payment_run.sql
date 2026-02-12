CREATE TABLE [dbo].[import_payment_run] (
    [payment_run_id]    INT          NOT NULL,
    [payment_id]        INT          NOT NULL,
    [pacs_user_id]      INT          NOT NULL,
    [status]            CHAR (5)     NOT NULL,
    [updated_date]      DATETIME     NULL,
    [paid_date]         DATETIME     NULL,
    [payment_run_type]  CHAR (5)     NOT NULL,
    [payment_post_date] DATETIME     NULL,
    [single_payment]    BIT          CONSTRAINT [CDF_import_payment_run_single_payment] DEFAULT ((0)) NOT NULL,
    [description]       VARCHAR (50) NULL,
    CONSTRAINT [CPK_import_payment_run] PRIMARY KEY CLUSTERED ([payment_run_id] ASC) WITH (FILLFACTOR = 100)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Description for the current run', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_payment_run', @level2type = N'COLUMN', @level2name = N'description';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'True if the run will be paid as a single payment, false for multiple payments', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_payment_run', @level2type = N'COLUMN', @level2name = N'single_payment';


GO

