CREATE TABLE [dbo].[monthly_as_of_recap_summary] (
    [pacs_user_id]     INT             NOT NULL,
    [entity_id]        INT             NOT NULL,
    [tax_year]         NUMERIC (4)     NOT NULL,
    [tax_year_desc]    VARCHAR (25)    NULL,
    [beg_balance]      NUMERIC (14, 2) NULL,
    [adj]              NUMERIC (14, 2) NULL,
    [adj_balance]      NUMERIC (14, 2) NULL,
    [prior_collection] NUMERIC (14, 2) NULL,
    [curr_collections] NUMERIC (14, 2) NULL,
    [base_tax]         NUMERIC (14, 2) NULL,
    [disc]             NUMERIC (14, 2) NULL,
    [underage]         NUMERIC (14, 2) NULL,
    [balance]          NUMERIC (14, 2) NULL,
    [p_i]              NUMERIC (14, 2) NULL,
    [atty_fees]        NUMERIC (14, 2) NULL,
    [overage]          NUMERIC (14, 2) NULL,
    [total]            NUMERIC (14, 2) NULL,
    [pct_outstanding]  NUMERIC (14, 2) NULL,
    [tax_cert]         NUMERIC (14, 2) NULL,
    [escrow]           NUMERIC (14, 2) NULL,
    [coll_month]       INT             NULL,
    [coll_year]        NUMERIC (4)     NULL,
    [max_year]         NUMERIC (4)     NULL,
    [fiscal_year]      VARCHAR (20)    NULL,
    [fiscal_begin_dt]  DATETIME        NULL,
    [fiscal_end_dt]    DATETIME        NULL,
    [begin_dt]         VARCHAR (50)    NULL,
    [end_dt]           VARCHAR (50)    NULL,
    CONSTRAINT [CPK_monthly_as_of_recap_summary] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC, [tax_year] ASC) WITH (FILLFACTOR = 100)
);


GO

