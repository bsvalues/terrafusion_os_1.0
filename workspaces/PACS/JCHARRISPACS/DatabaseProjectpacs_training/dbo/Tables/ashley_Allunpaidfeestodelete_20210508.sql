CREATE TABLE [dbo].[ashley_Allunpaidfeestodelete_20210508] (
    [prop_id]            INT             NOT NULL,
    [fee_id]             INT             NOT NULL,
    [owner_id]           INT             NULL,
    [statement_id]       INT             NULL,
    [current_amount_due] NUMERIC (14, 2) NULL,
    [amount_paid]        NUMERIC (14, 2) NOT NULL
);


GO

