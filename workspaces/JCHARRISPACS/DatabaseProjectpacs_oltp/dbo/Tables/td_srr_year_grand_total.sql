CREATE TABLE [dbo].[td_srr_year_grand_total] (
    [option_id]    INT             NOT NULL,
    [sup_group_id] INT             NOT NULL,
    [sup_yr]       NUMERIC (4)     NOT NULL,
    [sup_action]   CHAR (1)        NOT NULL,
    [pacs_user_id] INT             NOT NULL,
    [prop_count]   INT             NOT NULL,
    [curr_market]  NUMERIC (14)    NULL,
    [curr_taxable] NUMERIC (14)    NULL,
    [curr_tax]     NUMERIC (14, 2) NULL,
    [prev_market]  NUMERIC (14)    NULL,
    [prev_taxable] NUMERIC (14)    NULL,
    [prev_tax]     NUMERIC (14, 2) NULL,
    [gl_market]    NUMERIC (14)    NULL,
    [gl_taxable]   NUMERIC (14)    NULL,
    [gl_tax]       NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_td_srr_year_grand_total] PRIMARY KEY CLUSTERED ([option_id] ASC, [sup_group_id] ASC, [sup_yr] ASC, [sup_action] ASC),
    CONSTRAINT [CFK_td_srr_year_grand_total_option_id] FOREIGN KEY ([option_id]) REFERENCES [dbo].[td_srr_options] ([option_id])
);


GO

