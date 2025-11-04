CREATE TABLE [dbo].[ccCheckSum_main_image_old] (
    [prop_val_yr]  NUMERIC (4)   NOT NULL,
    [sup_num]      INT           NOT NULL,
    [prop_id]      INT           NOT NULL,
    [image_path]   VARCHAR (255) NULL,
    [checksum_val] INT           NULL
);


GO

CREATE CLUSTERED INDEX [idx_PK]
    ON [dbo].[ccCheckSum_main_image_old]([prop_val_yr] ASC, [sup_num] ASC, [prop_id] ASC);


GO

