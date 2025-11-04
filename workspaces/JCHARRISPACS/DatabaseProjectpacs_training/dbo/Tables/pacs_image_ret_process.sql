CREATE TABLE [dbo].[pacs_image_ret_process] (
    [process]      CHAR (10)     NOT NULL,
    [process_desc] VARCHAR (100) NULL,
    [role_type]    TINYINT       NOT NULL,
    CONSTRAINT [CPK_pacs_image_ret_process] PRIMARY KEY CLUSTERED ([process] ASC, [role_type] ASC)
);


GO

