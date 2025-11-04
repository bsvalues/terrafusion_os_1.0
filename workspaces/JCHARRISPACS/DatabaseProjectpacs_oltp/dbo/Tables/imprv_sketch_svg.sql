CREATE TABLE [dbo].[imprv_sketch_svg] (
    [prop_id]   INT           NOT NULL,
    [year]      INT           NOT NULL,
    [sup_num]   INT           NOT NULL,
    [imprv_id]  INT           NOT NULL,
    [file_name] VARCHAR (255) NULL,
    [comment]   VARCHAR (255) NULL,
    CONSTRAINT [PK_imprv_sketch_svg] PRIMARY KEY CLUSTERED ([prop_id] ASC, [year] ASC, [sup_num] ASC, [imprv_id] ASC)
);


GO

