CREATE TABLE [dbo].[gis_comp_sales_field] (
    [field_name] VARCHAR (30) NOT NULL,
    [alias]      VARCHAR (30) NOT NULL,
    [seq_num]    INT          NOT NULL,
    CONSTRAINT [CPK_gis_comp_sales_field] PRIMARY KEY CLUSTERED ([field_name] ASC)
);


GO

