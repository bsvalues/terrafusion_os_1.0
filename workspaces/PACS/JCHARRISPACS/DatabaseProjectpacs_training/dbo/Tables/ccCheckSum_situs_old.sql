CREATE TABLE [dbo].[ccCheckSum_situs_old] (
    [prop_id]      INT NOT NULL,
    [situs_id]     INT NOT NULL,
    [checksum_val] INT NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_situs_old]([prop_id] ASC, [situs_id] ASC);


GO

