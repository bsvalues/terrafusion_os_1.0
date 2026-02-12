CREATE TABLE [dbo].[fin_ap_import] (
    [fin_import_id]       INT             NOT NULL,
    [import_date]         DATETIME        NOT NULL,
    [import_user_id]      INT             NOT NULL,
    [disbursement_amount] NUMERIC (14, 2) NULL,
    [refund_amount]       NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_fin_ap_import] PRIMARY KEY CLUSTERED ([fin_import_id] ASC) WITH (FILLFACTOR = 100)
);


GO

