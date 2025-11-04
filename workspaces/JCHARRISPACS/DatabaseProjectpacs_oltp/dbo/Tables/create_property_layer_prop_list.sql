CREATE TABLE [dbo].[create_property_layer_prop_list] (
    [prop_val_yr] NUMERIC (4) NOT NULL,
    [sup_num]     INT         NOT NULL,
    [prop_id]     INT         NOT NULL,
    CONSTRAINT [CPK_create_property_layer_prop_list] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [sup_num] ASC, [prop_id] ASC) WITH (FILLFACTOR = 100)
);


GO

