CREATE TABLE [dbo].[rect_type] (
    [image_type]     CHAR (10)    NOT NULL,
    [rect_type]      CHAR (10)    NOT NULL,
    [rect_type_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_rect_type] PRIMARY KEY CLUSTERED ([image_type] ASC, [rect_type] ASC)
);


GO

