CREATE TABLE [dbo].[ccCheckSum_prop_group_assoc_old] (
    [prop_id]       INT          NOT NULL,
    [prop_group_cd] VARCHAR (20) NOT NULL,
    [checksum_val]  INT          NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_prop_group_assoc_old]([prop_id] ASC, [prop_group_cd] ASC);


GO

