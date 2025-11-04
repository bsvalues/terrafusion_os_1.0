CREATE TABLE [dbo].[picture_type] (
    [picture_type] CHAR (5)     NOT NULL,
    [picture_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_picture_type] PRIMARY KEY CLUSTERED ([picture_type] ASC)
);


GO

