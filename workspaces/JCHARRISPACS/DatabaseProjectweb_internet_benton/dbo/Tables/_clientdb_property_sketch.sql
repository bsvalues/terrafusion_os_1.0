CREATE TABLE [dbo].[_clientdb_property_sketch] (
    [id]          INT           IDENTITY (1, 1) NOT NULL,
    [prop_id]     INT           NOT NULL,
    [prop_val_yr] NUMERIC (4)   NOT NULL,
    [imprv_id]    INT           NOT NULL,
    [image_path]  VARCHAR (255) NULL,
    PRIMARY KEY CLUSTERED ([id] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX__clientdb_property_sketch]
    ON [dbo].[_clientdb_property_sketch]([prop_id] ASC);


GO

