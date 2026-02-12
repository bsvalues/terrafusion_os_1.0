CREATE TABLE [dbo].[refund_levy_run_tax_district_detail] (
    [refund_levy_run_id] INT             NOT NULL,
    [year]               NUMERIC (4)     NOT NULL,
    [tax_district_id]    INT             NOT NULL,
    [levy_cd]            VARCHAR (10)    NOT NULL,
    [fund_number]        NUMERIC (14)    NOT NULL,
    [refund_amount]      NUMERIC (14, 2) NOT NULL,
    [additional_amount]  NUMERIC (14, 2) NULL,
    [refund_levy_cd]     VARCHAR (10)    NOT NULL,
    [adjustment_amount]  NUMERIC (14, 2) NULL,
    [ADREF_amount]       NUMERIC (14, 2) NULL,
    CONSTRAINT [PK_refund_levy_run_tax_district_detail] PRIMARY KEY CLUSTERED ([refund_levy_run_id] ASC, [tax_district_id] ASC, [levy_cd] ASC),
    CONSTRAINT [FK_refund_levy_run_refund_levy_run_id] FOREIGN KEY ([refund_levy_run_id]) REFERENCES [dbo].[refund_levy_run] ([refund_levy_run_id]) ON DELETE CASCADE
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Levy Admin Refund Adjustment', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'refund_levy_run_tax_district_detail', @level2type = N'COLUMN', @level2name = N'ADREF_amount';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Levy Refund Adjustment', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'refund_levy_run_tax_district_detail', @level2type = N'COLUMN', @level2name = N'adjustment_amount';


GO

