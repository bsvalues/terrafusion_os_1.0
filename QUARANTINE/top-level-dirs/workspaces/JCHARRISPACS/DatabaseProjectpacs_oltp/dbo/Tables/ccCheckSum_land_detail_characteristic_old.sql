CREATE TABLE [dbo].[ccCheckSum_land_detail_characteristic_old] (
    [prop_val_yr]       NUMERIC (4)  NOT NULL,
    [sup_num]           INT          NOT NULL,
    [sale_id]           INT          NOT NULL,
    [prop_id]           INT          NOT NULL,
    [land_seg_id]       INT          NOT NULL,
    [characteristic_cd] VARCHAR (10) NOT NULL,
    [determinant_cd]    VARCHAR (20) NOT NULL,
    [checksum_val]      INT          NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_land_detail_characteristic_old]([prop_val_yr] ASC, [sup_num] ASC, [sale_id] ASC, [prop_id] ASC, [land_seg_id] ASC, [characteristic_cd] ASC, [determinant_cd] ASC);


GO

