CREATE TABLE [dbo].[imprv_sketch_error] (
    [prop_id]     INT         NOT NULL,
    [prop_val_yr] NUMERIC (4) NOT NULL,
    [imprv_id]    INT         NOT NULL,
    [sup_num]     INT         NOT NULL,
    [sale_id]     INT         NOT NULL,
    [error]       TEXT        NOT NULL,
    CONSTRAINT [CPK_imprv_sketch_error] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [sup_num] ASC, [sale_id] ASC, [prop_id] ASC, [imprv_id] ASC) WITH (FILLFACTOR = 100)
);


GO

