CREATE TABLE [dbo].[sub_type] (
    [image_type]             CHAR (10)    NOT NULL,
    [rect_type]              CHAR (10)    NOT NULL,
    [sub_type]               CHAR (10)    NOT NULL,
    [sub_type_desc]          VARCHAR (50) NULL,
    [expire_image]           CHAR (1)     NULL,
    [method]                 CHAR (5)     NULL,
    [expire_years]           INT          NULL,
    [supercede_options]      CHAR (5)     NULL,
    [supercede_expire_years] INT          NULL,
    [allow_website_images]   BIT          NOT NULL,
    [confidential]           BIT          NOT NULL,
    [transfer_to_penpad]     BIT          NOT NULL,
    [default_new_penpad]     BIT          NOT NULL,
    [deferral_image]         BIT          NOT NULL,
    CONSTRAINT [CPK_sub_type] PRIMARY KEY CLUSTERED ([image_type] ASC, [rect_type] ASC, [sub_type] ASC)
);


GO

