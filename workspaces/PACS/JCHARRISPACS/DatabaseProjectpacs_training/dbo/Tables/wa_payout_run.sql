CREATE TABLE [dbo].[wa_payout_run] (
    [run_id]                        INT           NOT NULL,
    [agreement_type]                VARCHAR (10)  NOT NULL,
    [special_assessment_agency]     VARCHAR (120) NULL,
    [include_delinquent_payout]     BIT           NOT NULL,
    [missed_payment_count]          INT           NOT NULL,
    [exclude_zero_due_payouts]      BIT           NOT NULL,
    [effective_date]                DATETIME      NOT NULL,
    [created_date]                  DATETIME      NOT NULL,
    [created_by]                    INT           NOT NULL,
    [last_printed_date]             DATETIME      NULL,
    [last_printed_by]               INT           NULL,
    [num_statements]                INT           NOT NULL,
    [barcode_statement_or_property] BIT           CONSTRAINT [CDF_wa_payout_run_barcode_statement_or_property] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_wa_payout_run] PRIMARY KEY CLUSTERED ([run_id] ASC) WITH (FILLFACTOR = 100)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Barcode information: 0 = Statement/Year, 1 = Property ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_payout_run', @level2type = N'COLUMN', @level2name = N'barcode_statement_or_property';


GO

