CREATE TABLE [dbo].[ccCheckSum_chg_of_owner_prop_assoc_old] (
    [chg_of_owner_id] INT NOT NULL,
    [prop_id]         INT NOT NULL,
    [checksum_val]    INT NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_chg_of_owner_prop_assoc_old]([chg_of_owner_id] ASC, [prop_id] ASC);


GO

