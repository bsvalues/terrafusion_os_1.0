CREATE TABLE [dbo].[ccCheckSum_property_profile_old] (
    [prop_val_yr]  NUMERIC (4) NOT NULL,
    [prop_id]      INT         NOT NULL,
    [checksum_val] INT         NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_property_profile_old]([prop_val_yr] ASC, [prop_id] ASC);


GO

