CREATE TABLE [dbo].[srr_prop_assoc] (
    [option_id]    INT         NOT NULL,
    [pacs_user_id] INT         NOT NULL,
    [sup_group_id] INT         NOT NULL,
    [sup_yr]       NUMERIC (4) NOT NULL,
    [prop_id]      INT         NOT NULL,
    [sort_id]      INT         IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [CPK_srr_prop_assoc] PRIMARY KEY CLUSTERED ([option_id] ASC, [pacs_user_id] ASC, [sup_group_id] ASC, [sup_yr] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90)
);


GO

