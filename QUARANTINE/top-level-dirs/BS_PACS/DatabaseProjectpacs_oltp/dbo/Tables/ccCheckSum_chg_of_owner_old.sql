CREATE TABLE [dbo].[ccCheckSum_chg_of_owner_old] (
    [prop_id]         INT NULL,
    [chg_of_owner_id] INT NOT NULL,
    [checksum_val]    INT NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_chg_of_owner_old]([prop_id] ASC, [chg_of_owner_id] ASC);


GO

