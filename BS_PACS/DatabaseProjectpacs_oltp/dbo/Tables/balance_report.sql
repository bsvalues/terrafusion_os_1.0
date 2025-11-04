CREATE TABLE [dbo].[balance_report] (
    [bill_id]         INT             NULL,
    [prop_id]         INT             NULL,
    [bill_amt_due]    NUMERIC (14, 2) NULL,
    [trans_amt_due]   NUMERIC (14, 2) NULL,
    [bill_amt]        NUMERIC (14, 2) NULL,
    [bill_adj]        NUMERIC (14, 2) NULL,
    [trans_amt]       NUMERIC (14, 2) NULL,
    [trans_adj]       NUMERIC (14, 2) NULL,
    [recap_trans_amt] NUMERIC (14, 2) NULL,
    [recap_adj_amt]   NUMERIC (14, 2) NULL,
    [comment]         VARCHAR (500)   NULL
);


GO

