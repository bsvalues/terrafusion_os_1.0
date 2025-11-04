CREATE TABLE [dbo].[recap_self_balance] (
    [pacs_user_id] INT             NOT NULL,
    [type]         VARCHAR (100)   NOT NULL,
    [entity_id]    INT             NOT NULL,
    [balance_diff] NUMERIC (14, 2) NULL,
    [tax_month]    INT             NOT NULL,
    [tax_yr]       NUMERIC (4)     NOT NULL,
    CONSTRAINT [CPK_recap_self_balance] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [type] ASC, [entity_id] ASC, [tax_month] ASC, [tax_yr] ASC) WITH (FILLFACTOR = 100)
);


GO

