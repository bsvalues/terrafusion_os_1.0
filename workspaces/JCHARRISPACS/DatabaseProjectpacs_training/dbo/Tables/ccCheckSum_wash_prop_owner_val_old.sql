CREATE TABLE [dbo].[ccCheckSum_wash_prop_owner_val_old] (
    [year]         NUMERIC (4) NOT NULL,
    [sup_num]      INT         NOT NULL,
    [prop_id]      INT         NOT NULL,
    [owner_id]     INT         NOT NULL,
    [checksum_val] INT         NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_wash_prop_owner_val_old]([year] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC);


GO

