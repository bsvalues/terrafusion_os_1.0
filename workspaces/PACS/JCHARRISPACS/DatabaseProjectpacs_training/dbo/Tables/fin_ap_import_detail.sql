CREATE TABLE [dbo].[fin_ap_import_detail] (
    [fin_import_id]          INT             NOT NULL,
    [disbursement_detail_id] INT             NOT NULL,
    [type]                   VARCHAR (10)    NOT NULL,
    [invoice_to]             VARCHAR (70)    NULL,
    [check_number]           VARCHAR (10)    NULL,
    [reference]              VARCHAR (25)    NULL,
    [amount]                 NUMERIC (14, 2) NOT NULL,
    [status_cd]              VARCHAR (20)    NULL,
    [previous_status_cd]     VARCHAR (20)    NULL,
    [fms_status_date]        DATETIME        NULL,
    [fin_import_detail_id]   INT             NOT NULL,
    CONSTRAINT [CPK_fin_ap_import_detail] PRIMARY KEY CLUSTERED ([fin_import_detail_id] ASC),
    CONSTRAINT [CFK_fin_ap_import_detail_fin_import_id] FOREIGN KEY ([fin_import_id]) REFERENCES [dbo].[fin_ap_import] ([fin_import_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_fin_import_id]
    ON [dbo].[fin_ap_import_detail]([fin_import_id] ASC) WITH (FILLFACTOR = 90);


GO

