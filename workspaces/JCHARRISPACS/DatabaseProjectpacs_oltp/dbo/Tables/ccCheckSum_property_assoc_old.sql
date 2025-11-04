CREATE TABLE [dbo].[ccCheckSum_property_assoc_old] (
    [prop_val_yr]    NUMERIC (4) NOT NULL,
    [sup_num]        INT         NOT NULL,
    [parent_prop_id] INT         NOT NULL,
    [child_prop_id]  INT         NOT NULL,
    [checksum_val]   INT         NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_property_assoc_old]([prop_val_yr] ASC, [sup_num] ASC, [parent_prop_id] ASC, [child_prop_id] ASC);


GO

