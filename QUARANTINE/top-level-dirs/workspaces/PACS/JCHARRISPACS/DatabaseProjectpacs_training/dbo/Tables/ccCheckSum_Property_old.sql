CREATE TABLE [dbo].[ccCheckSum_Property_old] (
    [prop_id]      INT NOT NULL,
    [checksum_val] INT NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_Property_old]([prop_id] ASC);


GO

