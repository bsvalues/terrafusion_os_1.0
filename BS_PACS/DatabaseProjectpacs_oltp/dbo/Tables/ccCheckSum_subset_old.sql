CREATE TABLE [dbo].[ccCheckSum_subset_old] (
    [prop_id]      INT         NULL,
    [subset_code]  VARCHAR (5) NOT NULL,
    [checksum_val] INT         NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_subset_old]([prop_id] ASC, [subset_code] ASC);


GO

