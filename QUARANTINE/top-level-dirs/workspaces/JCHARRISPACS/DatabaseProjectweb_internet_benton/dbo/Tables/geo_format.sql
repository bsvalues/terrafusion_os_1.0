CREATE TABLE [dbo].[geo_format] (
    [geo_format_id]     INT           IDENTITY (1, 1) NOT NULL,
    [geo_format_name]   VARCHAR (50)  NULL,
    [geo_format_string] VARCHAR (100) NULL,
    CONSTRAINT [CPK_geo_format] PRIMARY KEY CLUSTERED ([geo_format_id] ASC) WITH (FILLFACTOR = 90)
);


GO

