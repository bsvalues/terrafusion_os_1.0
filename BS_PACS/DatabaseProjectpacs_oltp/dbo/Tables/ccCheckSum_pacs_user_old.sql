CREATE TABLE [dbo].[ccCheckSum_pacs_user_old] (
    [pacs_user_id]   INT          NOT NULL,
    [pacs_user_name] VARCHAR (30) NOT NULL,
    [checksum_val]   INT          NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_pacs_user_old]([pacs_user_id] ASC);


GO

