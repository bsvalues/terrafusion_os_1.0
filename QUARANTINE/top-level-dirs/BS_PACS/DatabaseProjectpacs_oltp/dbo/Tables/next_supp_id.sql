CREATE TABLE [dbo].[next_supp_id] (
    [sup_year]    NUMERIC (4) NOT NULL,
    [next_sup_id] INT         NOT NULL,
    CONSTRAINT [CPK_next_supp_id] PRIMARY KEY CLUSTERED ([sup_year] ASC) WITH (FILLFACTOR = 100)
);


GO

