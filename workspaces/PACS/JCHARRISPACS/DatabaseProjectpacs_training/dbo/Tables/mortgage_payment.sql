CREATE TABLE [dbo].[mortgage_payment] (
    [mortgage_run_id]  INT             NOT NULL,
    [prop_id]          INT             NOT NULL,
    [mortgage_co_id]   INT             NOT NULL,
    [mortgage_acct_id] VARCHAR (50)    NULL,
    [year]             NUMERIC (4)     NOT NULL,
    [pacs_base_tax]    NUMERIC (14, 2) NULL,
    [amt_pd]           NUMERIC (14, 2) NULL,
    [status]           CHAR (5)        NULL,
    [owner_id]         INT             NULL,
    CONSTRAINT [CPK_mortgage_payment] PRIMARY KEY CLUSTERED ([mortgage_run_id] ASC, [prop_id] ASC, [year] ASC, [mortgage_co_id] ASC) WITH (FILLFACTOR = 100)
);


GO

