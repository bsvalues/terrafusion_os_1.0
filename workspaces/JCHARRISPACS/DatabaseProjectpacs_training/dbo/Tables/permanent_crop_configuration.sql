CREATE TABLE [dbo].[permanent_crop_configuration] (
    [year]     NUMERIC (4) NOT NULL,
    [field_id] INT         NOT NULL,
    [visible]  BIT         DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_permanent_crop_configuration] PRIMARY KEY CLUSTERED ([year] ASC, [field_id] ASC),
    CONSTRAINT [CFK_meta_permanent_crop_field_id] FOREIGN KEY ([field_id]) REFERENCES [dbo].[meta_permanent_crop] ([field_id])
);


GO

