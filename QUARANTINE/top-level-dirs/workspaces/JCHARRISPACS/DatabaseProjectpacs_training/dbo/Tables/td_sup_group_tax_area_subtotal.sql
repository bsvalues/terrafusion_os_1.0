CREATE TABLE [dbo].[td_sup_group_tax_area_subtotal] (
    [sup_group_id]    INT             NOT NULL,
    [sup_yr]          NUMERIC (4)     NOT NULL,
    [sup_num]         INT             NOT NULL,
    [tax_area_id]     INT             NOT NULL,
    [sup_action]      CHAR (1)        NOT NULL,
    [tax_area_number] VARCHAR (23)    NOT NULL,
    [prop_count]      INT             NOT NULL,
    [curr_market]     NUMERIC (14)    NULL,
    [curr_taxable]    NUMERIC (14)    NULL,
    [curr_tax]        NUMERIC (14, 2) NULL,
    [prev_market]     NUMERIC (14)    NULL,
    [prev_taxable]    NUMERIC (14)    NULL,
    [prev_tax]        NUMERIC (14, 2) NULL,
    [gl_market]       NUMERIC (14)    NULL,
    [gl_taxable]      NUMERIC (14)    NULL,
    [gl_tax]          NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_td_sup_group_tax_area_subtotal] PRIMARY KEY CLUSTERED ([sup_group_id] ASC, [sup_yr] ASC, [sup_num] ASC, [tax_area_id] ASC, [sup_action] ASC),
    CONSTRAINT [CFK_td_sup_group_tax_area_subtotal_tax_area_id] FOREIGN KEY ([tax_area_id]) REFERENCES [dbo].[tax_area] ([tax_area_id])
);


GO

