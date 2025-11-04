CREATE TABLE [dbo].[sales_ratio_list] (
    [dataset_id]      INT         NOT NULL,
    [chg_of_owner_id] INT         NOT NULL,
    [year]            NUMERIC (4) NOT NULL,
    [sup_num]         INT         NOT NULL,
    [main_prop_id]    INT         NULL,
    CONSTRAINT [CPK_sales_ratio_list] PRIMARY KEY CLUSTERED ([dataset_id] ASC, [chg_of_owner_id] ASC) WITH (FILLFACTOR = 100)
);


GO

