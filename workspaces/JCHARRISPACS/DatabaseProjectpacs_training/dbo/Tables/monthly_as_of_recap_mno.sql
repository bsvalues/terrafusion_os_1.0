CREATE TABLE [dbo].[monthly_as_of_recap_mno] (
    [pacs_user_id]         INT             NOT NULL,
    [entity_id]            INT             NOT NULL,
    [tax_year]             NUMERIC (4)     NOT NULL,
    [tax_year_desc]        VARCHAR (25)    NULL,
    [beg_balance_mno]      NUMERIC (14, 2) NULL,
    [adj_mno]              NUMERIC (14, 2) NULL,
    [adj_balance_mno]      NUMERIC (14, 2) NULL,
    [prior_collection_mno] NUMERIC (14, 2) NULL,
    [curr_collections_mno] NUMERIC (14, 2) NULL,
    [base_tax_mno]         NUMERIC (14, 2) NULL,
    [disc_mno]             NUMERIC (14, 2) NULL,
    [underage_mno]         NUMERIC (14, 2) NULL,
    [balance_mno]          NUMERIC (14, 2) NULL,
    [p_i_mno]              NUMERIC (14, 2) NULL,
    [overage_mno]          NUMERIC (14, 2) NULL,
    [total_mno]            NUMERIC (14, 2) NULL,
    [pct_outstanding_mno]  NUMERIC (14, 2) NULL,
    [coll_month]           INT             NULL,
    [coll_year]            NUMERIC (4)     NULL,
    [max_year]             NUMERIC (4)     NULL,
    [lKey]                 INT             IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [CPK_monthly_as_of_recap_mno] PRIMARY KEY CLUSTERED ([lKey] ASC) WITH (FILLFACTOR = 100)
);


GO

