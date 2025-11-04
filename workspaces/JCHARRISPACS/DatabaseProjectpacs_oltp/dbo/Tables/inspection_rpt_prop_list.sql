CREATE TABLE [dbo].[inspection_rpt_prop_list] (
    [pacs_user_id] INT         NOT NULL,
    [prop_id]      INT         NOT NULL,
    [sup_num]      INT         NOT NULL,
    [owner_tax_yr] NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_inspection_rpt_prop_list] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [prop_id] ASC, [sup_num] ASC, [owner_tax_yr] ASC) WITH (FILLFACTOR = 100)
);


GO

