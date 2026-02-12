CREATE TABLE [dbo].[import_payment_tenders] (
    [payment_run_id] INT             NOT NULL,
    [tender_id]      INT             NOT NULL,
    [tender_type]    VARCHAR (10)    NOT NULL,
    [amount]         NUMERIC (14, 2) NOT NULL,
    [ref_number]     VARCHAR (10)    NULL,
    [description]    VARCHAR (30)    NULL,
    [dl_number]      VARCHAR (10)    NULL,
    [dl_state]       VARCHAR (5)     NULL,
    CONSTRAINT [CPK_import_payment_tenders] PRIMARY KEY CLUSTERED ([payment_run_id] ASC, [tender_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_import_payment_tenders_payment_run_id] FOREIGN KEY ([payment_run_id]) REFERENCES [dbo].[import_payment_run] ([payment_run_id])
);


GO

