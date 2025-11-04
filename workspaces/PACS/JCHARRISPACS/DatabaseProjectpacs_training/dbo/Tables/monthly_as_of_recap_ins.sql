CREATE TABLE [dbo].[monthly_as_of_recap_ins] (
    [pacs_user_id]         INT             NOT NULL,
    [entity_id]            INT             NOT NULL,
    [tax_year]             NUMERIC (4)     NOT NULL,
    [tax_year_desc]        VARCHAR (25)    NULL,
    [beg_balance_ins]      NUMERIC (14, 2) NULL,
    [adj_ins]              NUMERIC (14, 2) NULL,
    [adj_balance_ins]      NUMERIC (14, 2) NULL,
    [prior_collection_ins] NUMERIC (14, 2) NULL,
    [curr_collections_ins] NUMERIC (14, 2) NULL,
    [base_tax_ins]         NUMERIC (14, 2) NULL,
    [disc_ins]             NUMERIC (14, 2) NULL,
    [underage_ins]         NUMERIC (14, 2) NULL,
    [balance_ins]          NUMERIC (14, 2) NULL,
    [p_i_ins]              NUMERIC (14, 2) NULL,
    [overage_ins]          NUMERIC (14, 2) NULL,
    [total_ins]            NUMERIC (14, 2) NULL,
    [pct_outstanding_ins]  NUMERIC (14, 2) NULL,
    [coll_month]           INT             NULL,
    [coll_year]            NUMERIC (4)     NULL,
    [max_year]             NUMERIC (4)     NULL,
    [lKey]                 INT             IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [CPK_monthly_as_of_recap_ins] PRIMARY KEY CLUSTERED ([lKey] ASC) WITH (FILLFACTOR = 100)
);


GO

