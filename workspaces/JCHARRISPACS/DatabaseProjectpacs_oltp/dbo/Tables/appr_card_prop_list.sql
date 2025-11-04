CREATE TABLE [dbo].[appr_card_prop_list] (
    [pacs_user_id] INT         NOT NULL,
    [order_id]     INT         NOT NULL,
    [prop_id]      INT         NOT NULL,
    [prop_val_yr]  NUMERIC (4) NOT NULL,
    [sup_num]      INT         NOT NULL,
    [sale_id]      INT         NOT NULL,
    CONSTRAINT [CPK_appr_card_prop_list] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [prop_id] ASC, [prop_val_yr] ASC, [sup_num] ASC, [sale_id] ASC) WITH (FILLFACTOR = 100)
);


GO

