CREATE TABLE [dbo].[ccCheckSum_prop_event_assoc_old] (
    [prop_id]      INT NULL,
    [event_id]     INT NOT NULL,
    [checksum_val] INT NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_prop_event_assoc_old]([prop_id] ASC, [event_id] ASC);


GO

