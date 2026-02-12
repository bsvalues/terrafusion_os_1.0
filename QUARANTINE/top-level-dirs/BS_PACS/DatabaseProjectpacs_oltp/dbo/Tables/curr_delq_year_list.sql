CREATE TABLE [dbo].[curr_delq_year_list] (
    [pacs_user_id] INT         NOT NULL,
    [tax_year]     NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_curr_delq_year_list] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [tax_year] ASC) WITH (FILLFACTOR = 100)
);


GO

