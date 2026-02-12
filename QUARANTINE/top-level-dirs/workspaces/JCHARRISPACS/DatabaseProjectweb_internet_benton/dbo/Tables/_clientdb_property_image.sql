CREATE TABLE [dbo].[_clientdb_property_image] (
    [id]         INT           IDENTITY (1, 1) NOT NULL,
    [prop_id]    INT           NOT NULL,
    [year]       NUMERIC (4)   NOT NULL,
    [image_path] VARCHAR (255) NULL,
    [image_nm]   VARCHAR (64)  NULL,
    [image_type] CHAR (10)     NULL,
    [sub_type]   CHAR (10)     NULL,
    [rec_type]   CHAR (10)     NULL,
    [comment]    VARCHAR (255) NULL,
    PRIMARY KEY CLUSTERED ([id] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX__clientdb_property_image]
    ON [dbo].[_clientdb_property_image]([prop_id] ASC);


GO

