CREATE TABLE [dbo].[escrow_worksheet_print_history] (
    [history_id]             INT              NOT NULL,
    [escrow_id]              INT              NOT NULL,
    [address]                VARCHAR (MAX)    NULL,
    [prop_id]                INT              NULL,
    [escrow_type_desc]       VARCHAR (30)     NULL,
    [comment]                VARCHAR (80)     NULL,
    [preparer_name]          VARCHAR (30)     NULL,
    [calculation_date]       DATETIME         NULL,
    [advance_year]           NUMERIC (4)      NOT NULL,
    [tax_area_number]        VARCHAR (23)     NULL,
    [levy_assessed_value]    NUMERIC (14, 2)  NULL,
    [levy_rate]              NUMERIC (13, 10) NULL,
    [levy_advance_taxes]     NUMERIC (14, 2)  NULL,
    [sa_advance_taxes]       NUMERIC (14, 2)  NULL,
    [advance_taxes_due]      NUMERIC (14, 2)  NULL,
    [advance_taxes_override] BIT              NULL,
    [additional_fee_desc]    VARCHAR (60)     NULL,
    [additional_fee_amount]  NUMERIC (14, 2)  NULL,
    [creation_date]          DATETIME         NULL,
    CONSTRAINT [CPK_escrow_worksheet_print_history] PRIMARY KEY CLUSTERED ([history_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'show escrow create date on the report', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'escrow_worksheet_print_history', @level2type = N'COLUMN', @level2name = N'creation_date';


GO

