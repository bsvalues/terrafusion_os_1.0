CREATE TABLE [dbo].[recalc_ptd_list] (
    [pacs_user_id] INT         NOT NULL,
    [prop_id]      INT         NOT NULL,
    [sup_num]      INT         NOT NULL,
    [sup_yr]       NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_recalc_ptd_list] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [prop_id] ASC, [sup_yr] ASC, [sup_num] ASC) WITH (FILLFACTOR = 100)
);


GO

