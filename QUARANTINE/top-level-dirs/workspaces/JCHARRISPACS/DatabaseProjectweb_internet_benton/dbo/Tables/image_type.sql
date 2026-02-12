CREATE TABLE [dbo].[image_type] (
    [image_type]         CHAR (10)    NOT NULL,
    [image_desc]         VARCHAR (50) NULL,
    [picture_type]       CHAR (5)     NOT NULL,
    [scanned_user_right] CHAR (1)     NULL,
    [photo_user_right]   CHAR (1)     NULL,
    CONSTRAINT [CPK_image_type] PRIMARY KEY CLUSTERED ([image_type] ASC)
);


GO

