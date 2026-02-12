CREATE TABLE [dbo].[recalc_prop_list_current_division] (
    [prop_id]      INT         NOT NULL,
    [sup_num]      INT         NOT NULL,
    [sup_yr]       NUMERIC (4) NOT NULL,
    [pacs_user_id] BIGINT      NOT NULL,
    CONSTRAINT [CPK_recalc_prop_list_current_division] PRIMARY KEY CLUSTERED ([sup_yr] ASC, [sup_num] ASC, [prop_id] ASC, [pacs_user_id] ASC) WITH (FILLFACTOR = 100)
);


GO

