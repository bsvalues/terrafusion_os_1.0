CREATE TABLE [dbo].[ccCheckSum_neighborhood_old] (
    [prop_id]      INT          NULL,
    [hood_cd]      VARCHAR (10) NOT NULL,
    [hood_yr]      NUMERIC (4)  NOT NULL,
    [checksum_val] INT          NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_neighborhood_old]([prop_id] ASC, [hood_cd] ASC, [hood_yr] ASC);


GO

