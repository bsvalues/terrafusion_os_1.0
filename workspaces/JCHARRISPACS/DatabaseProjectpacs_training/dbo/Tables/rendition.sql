CREATE TABLE [dbo].[rendition] (
    [prop_id]           INT             NOT NULL,
    [prop_val_yr]       NUMERIC (4)     NOT NULL,
    [rendition_id]      INT             NOT NULL,
    [sup_num]           INT             NOT NULL,
    [rend_yr]           NUMERIC (4)     NULL,
    [rend_dt]           DATETIME        NULL,
    [tot_rend_amt]      NUMERIC (14, 2) NULL,
    [rend_verify_dt]    DATETIME        NULL,
    [rend_comment]      VARCHAR (255)   NULL,
    [rend_purge_dt]     DATETIME        NULL,
    [rend_submitted_by] VARCHAR (50)    NULL,
    [rend_notarized]    VARCHAR (50)    NULL,
    [rend_active]       CHAR (1)        NULL,
    CONSTRAINT [CPK_rendition] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [sup_num] ASC, [prop_id] ASC, [rendition_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_rendition_prop_val_yr_sup_num_prop_id] FOREIGN KEY ([prop_val_yr], [sup_num], [prop_id]) REFERENCES [dbo].[property_val] ([prop_val_yr], [sup_num], [prop_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[rendition]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

