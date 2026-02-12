CREATE TABLE [dbo].[pictometry_images] (
    [image_id]          INT           NOT NULL,
    [prop_id]           INT           NOT NULL,
    [direction]         CHAR (1)      NOT NULL,
    [year]              NUMERIC (4)   NOT NULL,
    [source_image_name] VARCHAR (255) NULL,
    [px1]               INT           NULL,
    [py1]               INT           NULL,
    [px2]               INT           NULL,
    [py2]               INT           NULL,
    [cx]                INT           NULL,
    [cy]                INT           NULL,
    [best_view]         BIT           NOT NULL,
    CONSTRAINT [CPK_pictometry_images] PRIMARY KEY CLUSTERED ([image_id] ASC) WITH (FILLFACTOR = 100)
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[pictometry_images]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

