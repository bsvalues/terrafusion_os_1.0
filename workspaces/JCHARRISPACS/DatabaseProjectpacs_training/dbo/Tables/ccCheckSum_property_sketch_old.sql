CREATE TABLE [dbo].[ccCheckSum_property_sketch_old] (
    [prop_id]      INT         NOT NULL,
    [prop_val_yr]  NUMERIC (4) NOT NULL,
    [sup_num]      INT         NOT NULL,
    [checksum_val] INT         NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_property_sketch_old]([prop_id] ASC, [prop_val_yr] ASC, [sup_num] ASC);


GO

