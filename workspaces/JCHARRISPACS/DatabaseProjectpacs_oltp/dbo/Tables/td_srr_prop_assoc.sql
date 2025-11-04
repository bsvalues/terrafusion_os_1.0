CREATE TABLE [dbo].[td_srr_prop_assoc] (
    [option_id]    INT         NOT NULL,
    [pacs_user_id] INT         NOT NULL,
    [sup_group_id] INT         NOT NULL,
    [sup_yr]       NUMERIC (4) NOT NULL,
    [prop_id]      INT         NOT NULL,
    [sort_id]      INT         IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [CPK_td_srr_prop_assoc] PRIMARY KEY CLUSTERED ([option_id] ASC, [pacs_user_id] ASC, [sup_group_id] ASC, [sup_yr] ASC, [prop_id] ASC),
    CONSTRAINT [CFK_td_srr_prop_assoc_option_id] FOREIGN KEY ([option_id]) REFERENCES [dbo].[td_srr_options] ([option_id])
);


GO

