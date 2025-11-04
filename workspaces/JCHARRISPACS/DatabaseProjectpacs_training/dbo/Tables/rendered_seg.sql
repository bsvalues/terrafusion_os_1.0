CREATE TABLE [dbo].[rendered_seg] (
    [prop_id]       INT             NOT NULL,
    [prop_val_yr]   NUMERIC (4)     NOT NULL,
    [pp_id]         INT             NOT NULL,
    [pp_seg_id]     INT             NOT NULL,
    [rendition_id]  INT             NOT NULL,
    [sup_num]       INT             NOT NULL,
    [rendition_amt] NUMERIC (14, 2) NULL,
    [sale_id]       INT             NULL,
    CONSTRAINT [CPK_rendered_seg] PRIMARY KEY CLUSTERED ([prop_id] ASC, [prop_val_yr] ASC, [sup_num] ASC, [pp_seg_id] ASC, [pp_id] ASC, [rendition_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_rendered_seg_prop_val_yr_sup_num_prop_id_pp_seg_id] FOREIGN KEY ([prop_val_yr], [sup_num], [prop_id], [pp_seg_id]) REFERENCES [dbo].[pers_prop_seg] ([prop_val_yr], [sup_num], [prop_id], [pp_seg_id])
);


GO

