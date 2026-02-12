CREATE TABLE [dbo].[ccCheckSum_owner_old] (
    [owner_tax_yr] NUMERIC (4) NOT NULL,
    [sup_num]      INT         NOT NULL,
    [prop_id]      INT         NOT NULL,
    [owner_id]     INT         NOT NULL,
    [checksum_val] INT         NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_owner_old]([owner_tax_yr] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC);


GO

