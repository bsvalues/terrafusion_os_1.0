CREATE TABLE [dbo].[installment_agreement_schedule] (
    [ia_id]          INT             NOT NULL,
    [ia_schedule_id] INT             IDENTITY (1, 1) NOT NULL,
    [ia_dt_due]      DATETIME        NULL,
    [ia_amt_due]     NUMERIC (14, 2) NULL,
    [ia_amt_pd]      NUMERIC (14, 2) NULL,
    [ia_dt_pd]       DATETIME        NULL,
    [ia_status]      VARCHAR (5)     NULL,
    CONSTRAINT [CPK_installment_agreement_schedule] PRIMARY KEY CLUSTERED ([ia_schedule_id] ASC) WITH (FILLFACTOR = 100)
);


GO

