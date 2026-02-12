CREATE TABLE [dbo].[ccCheckSum_imprv_adj_type_old] (
    [prop_id]             INT         NULL,
    [imprv_adj_type_year] NUMERIC (4) NOT NULL,
    [imprv_adj_type_cd]   CHAR (5)    NOT NULL,
    [checksum_val]        INT         NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_imprv_adj_type_old]([prop_id] ASC, [imprv_adj_type_year] ASC, [imprv_adj_type_cd] ASC);


GO

