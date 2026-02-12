CREATE TABLE [dbo].[escrow_calculation] (
    [escrow_id]              INT              NOT NULL,
    [levy_assessed_value]    NUMERIC (14, 2)  NULL,
    [levy_rate]              NUMERIC (13, 10) NULL,
    [levy_advance_taxes]     NUMERIC (14, 2)  NULL,
    [sa_advance_taxes]       NUMERIC (14, 2)  NULL,
    [advance_taxes_due]      NUMERIC (14, 2)  NOT NULL,
    [advance_taxes_override] BIT              DEFAULT ((0)) NOT NULL,
    [posting_date]           DATETIME         NOT NULL,
    [additional_fee_id]      INT              NULL,
    [additional_fee_amt]     NUMERIC (14, 2)  NULL,
    [levy_tax_selected]      BIT              NOT NULL,
    [sa_tax_selected]        BIT              NOT NULL,
    CONSTRAINT [CPK_escrow_id] PRIMARY KEY CLUSTERED ([escrow_id] ASC),
    CONSTRAINT [FK_escrow_escrow_id1] FOREIGN KEY ([escrow_id]) REFERENCES [dbo].[escrow] ([escrow_id])
);


GO

