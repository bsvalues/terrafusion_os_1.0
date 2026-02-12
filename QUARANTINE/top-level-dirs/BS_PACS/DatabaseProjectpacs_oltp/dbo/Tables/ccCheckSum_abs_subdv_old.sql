CREATE TABLE [dbo].[ccCheckSum_abs_subdv_old] (
    [prop_id]      INT          NULL,
    [abs_subdv_cd] VARCHAR (10) NOT NULL,
    [abs_subdv_yr] NUMERIC (4)  NOT NULL,
    [checksum_val] INT          NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_abs_subdv_old]([prop_id] ASC, [abs_subdv_cd] ASC, [abs_subdv_yr] ASC);


GO

