CREATE TABLE [dbo].[pacs_image_ret_process_assoc] (
    [process]    CHAR (10) NOT NULL,
    [image_type] CHAR (10) NOT NULL,
    [rect_type]  CHAR (10) NOT NULL,
    [sub_type]   CHAR (10) NOT NULL,
    [role_type]  TINYINT   NOT NULL,
    CONSTRAINT [CPK_pacs_image_ret_process_assoc] PRIMARY KEY CLUSTERED ([process] ASC, [image_type] ASC, [rect_type] ASC, [sub_type] ASC, [role_type] ASC)
);


GO

