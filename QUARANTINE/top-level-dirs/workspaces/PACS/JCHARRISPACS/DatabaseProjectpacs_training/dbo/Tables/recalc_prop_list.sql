CREATE TABLE [dbo].[recalc_prop_list] (
    [prop_id]      INT         NOT NULL,
    [sup_num]      INT         NOT NULL,
    [sup_yr]       NUMERIC (4) NOT NULL,
    [pacs_user_id] BIGINT      NOT NULL,
    CONSTRAINT [CPK_recalc_prop_list] PRIMARY KEY CLUSTERED ([prop_id] ASC, [sup_yr] ASC, [sup_num] ASC, [pacs_user_id] ASC) WITH (FILLFACTOR = 100)
);


GO

