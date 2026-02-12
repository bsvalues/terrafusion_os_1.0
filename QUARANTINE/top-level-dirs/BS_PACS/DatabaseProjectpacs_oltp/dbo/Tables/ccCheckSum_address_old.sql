CREATE TABLE [dbo].[ccCheckSum_address_old] (
    [prop_id]      INT      NULL,
    [acct_id]      INT      NOT NULL,
    [addr_type_cd] CHAR (5) NOT NULL,
    [checksum_val] INT      NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_address_old]([prop_id] ASC, [acct_id] ASC, [addr_type_cd] ASC);


GO

