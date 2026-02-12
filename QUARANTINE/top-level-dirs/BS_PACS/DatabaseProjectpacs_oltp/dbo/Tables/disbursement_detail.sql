CREATE TABLE [dbo].[disbursement_detail] (
    [disbursement_id]        INT             NOT NULL,
    [disbursement_detail_id] INT             NOT NULL,
    [reference_id_type]      CHAR (10)       NOT NULL,
    [reference_id]           INT             NOT NULL,
    [export_to_fms]          BIT             NOT NULL,
    [amount]                 NUMERIC (14, 2) NOT NULL,
    [status_cd]              VARCHAR (20)    NULL,
    [reference_id_year]      INT             NULL,
    CONSTRAINT [CPK_disbursement_detail] PRIMARY KEY CLUSTERED ([disbursement_id] ASC, [disbursement_detail_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_disbursement_detail_disbursement_id] FOREIGN KEY ([disbursement_id]) REFERENCES [dbo].[disbursement] ([disbursement_id]),
    CONSTRAINT [CUQ_disbursement_detail_disbursement_detail_id] UNIQUE NONCLUSTERED ([disbursement_detail_id] ASC) WITH (FILLFACTOR = 90)
);


GO

