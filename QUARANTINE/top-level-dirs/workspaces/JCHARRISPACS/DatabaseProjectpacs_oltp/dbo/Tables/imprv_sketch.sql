CREATE TABLE [dbo].[imprv_sketch] (
    [prop_id]     INT             NOT NULL,
    [prop_val_yr] NUMERIC (4)     NOT NULL,
    [imprv_id]    INT             NOT NULL,
    [sup_num]     INT             NOT NULL,
    [sale_id]     INT             NOT NULL,
    [sketch]      VARBINARY (MAX) NOT NULL,
    CONSTRAINT [CPK_imprv_sketch] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [sup_num] ASC, [sale_id] ASC, [prop_id] ASC, [imprv_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_imprv_sketch_prop_val_yr_sup_num_sale_id_prop_id_imprv_id] FOREIGN KEY ([prop_val_yr], [sup_num], [sale_id], [prop_id], [imprv_id]) REFERENCES [dbo].[imprv] ([prop_val_yr], [sup_num], [sale_id], [prop_id], [imprv_id])
);


GO

