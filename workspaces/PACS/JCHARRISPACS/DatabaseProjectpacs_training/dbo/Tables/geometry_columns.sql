CREATE TABLE [dbo].[geometry_columns] (
    [f_table_catalog]   VARCHAR (128) NOT NULL,
    [f_table_schema]    VARCHAR (128) NOT NULL,
    [f_table_name]      VARCHAR (256) NOT NULL,
    [f_geometry_column] VARCHAR (256) NOT NULL,
    [coord_dimension]   INT           NOT NULL,
    [srid]              INT           NOT NULL,
    [geometry_type]     VARCHAR (30)  NOT NULL,
    CONSTRAINT [geometry_columns_pk] PRIMARY KEY CLUSTERED ([f_table_catalog] ASC, [f_table_schema] ASC, [f_table_name] ASC, [f_geometry_column] ASC)
);


GO

