CREATE TABLE [dbo].[deed_import_batch] (
    [batch_id]          INT           IDENTITY (1, 1) NOT NULL,
    [batch_create_dt]   DATETIME      NOT NULL,
    [image_path]        VARCHAR (255) NOT NULL,
    [year]              INT           NOT NULL,
    [details_file_path] VARCHAR (255) NULL,
    [images_file_path]  VARCHAR (255) NULL,
    CONSTRAINT [CPK_deed_import_batch] PRIMARY KEY CLUSTERED ([batch_id] ASC) WITH (FILLFACTOR = 100)
);


GO

