CREATE TABLE [dbo].[soa_run] (
    [dataset_id]                    BIGINT      NOT NULL,
    [bill_dataset_id]               INT         NOT NULL,
    [fee_dataset_id]                INT         NOT NULL,
    [overpayment_credit_dataset_id] INT         NOT NULL,
    [posting_date]                  DATETIME    NOT NULL,
    [year]                          NUMERIC (4) NOT NULL,
    [sup_num]                       INT         NOT NULL,
    [prop_id]                       INT         NOT NULL,
    [paid_item_year_option]         NUMERIC (4) NULL,
    [paid_refund_year_option]       NUMERIC (4) NULL,
    PRIMARY KEY CLUSTERED ([dataset_id] ASC) WITH (FILLFACTOR = 100)
);


GO

