CREATE TABLE [dbo].[ccCheckSum_imprv_attr_old] (
    [prop_val_yr]   NUMERIC (4) NOT NULL,
    [sup_num]       INT         NOT NULL,
    [sale_id]       INT         NOT NULL,
    [prop_id]       INT         NOT NULL,
    [imprv_id]      INT         NOT NULL,
    [imprv_det_id]  INT         NOT NULL,
    [imprv_attr_id] INT         NOT NULL,
    [i_attr_val_id] INT         NOT NULL,
    [checksum_val]  INT         NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_imprv_attr_old]([prop_val_yr] ASC, [sup_num] ASC, [sale_id] ASC, [prop_id] ASC, [imprv_id] ASC, [imprv_det_id] ASC, [imprv_attr_id] ASC, [i_attr_val_id] ASC);


GO

