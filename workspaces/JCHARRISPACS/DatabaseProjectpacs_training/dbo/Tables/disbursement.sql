CREATE TABLE [dbo].[disbursement] (
    [disbursement_id]  INT             NOT NULL,
    [date]             DATETIME        NOT NULL,
    [user_id]          INT             NOT NULL,
    [as_of_date]       DATETIME        NULL,
    [amount]           NUMERIC (14, 2) NOT NULL,
    [type]             VARCHAR (10)    NOT NULL,
    [exported]         BIT             CONSTRAINT [CDF_disbursement_exported] DEFAULT ((0)) NOT NULL,
    [export_user_id]   INT             NULL,
    [export_date]      DATETIME        NULL,
    [transaction_date] DATETIME        NULL,
    CONSTRAINT [CPK_disbursement] PRIMARY KEY CLUSTERED ([disbursement_id] ASC) WITH (FILLFACTOR = 100)
);


GO

