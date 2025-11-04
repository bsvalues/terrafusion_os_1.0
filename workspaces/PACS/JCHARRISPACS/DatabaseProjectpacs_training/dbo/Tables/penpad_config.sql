CREATE TABLE [dbo].[penpad_config] (
    [default_image_type] CHAR (10) NOT NULL,
    [default_rec_type]   CHAR (10) NOT NULL,
    [default_sub_type]   CHAR (10) NOT NULL,
    CONSTRAINT [CPK_penpad_config] PRIMARY KEY CLUSTERED ([default_image_type] ASC) WITH (FILLFACTOR = 100)
);


GO

