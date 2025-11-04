CREATE TABLE [dbo].[ccCheckSum_prop_building_permit_assoc_old] (
    [prop_id]        INT NOT NULL,
    [bldg_permit_id] INT NOT NULL,
    [checksum_val]   INT NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_prop_building_permit_assoc_old]([prop_id] ASC, [bldg_permit_id] ASC);


GO

