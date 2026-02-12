CREATE TABLE [dbo].[td_sup_group_tax_area_summary] (
    [sup_group_id]    INT             NOT NULL,
    [tax_area_id]     INT             NOT NULL,
    [sup_action]      CHAR (1)        NOT NULL,
    [sup_yr]          NUMERIC (4)     NOT NULL,
    [curr_market]     NUMERIC (14)    NULL,
    [curr_taxable]    NUMERIC (14)    NULL,
    [curr_tax]        NUMERIC (14, 2) NULL,
    [prev_market]     NUMERIC (14)    NULL,
    [prev_taxable]    NUMERIC (14)    NULL,
    [prev_tax]        NUMERIC (14, 2) NULL,
    [gl_market]       NUMERIC (14)    NULL,
    [gl_taxable]      NUMERIC (14)    NULL,
    [gl_tax]          NUMERIC (14, 2) NULL,
    [prop_id]         INT             NOT NULL,
    [sup_num]         INT             NOT NULL,
    [tax_area_number] VARCHAR (23)    NOT NULL,
    CONSTRAINT [CPK_td_sup_group_tax_area_summary] PRIMARY KEY CLUSTERED ([sup_group_id] ASC, [sup_yr] ASC, [prop_id] ASC, [sup_num] ASC, [tax_area_id] ASC, [sup_action] ASC),
    CONSTRAINT [CFK_td_sup_group_tax_area_summary_sup_group_id] FOREIGN KEY ([sup_group_id]) REFERENCES [dbo].[sup_group] ([sup_group_id])
);


GO

