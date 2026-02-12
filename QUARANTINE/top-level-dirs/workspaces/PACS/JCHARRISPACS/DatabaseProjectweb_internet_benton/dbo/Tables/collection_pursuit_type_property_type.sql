CREATE TABLE [dbo].[collection_pursuit_type_property_type] (
    [pursuit_type_code] VARCHAR (10) NOT NULL,
    [prop_type_cd]      CHAR (5)     NOT NULL,
    CONSTRAINT [CPK_collection_pursuit_type_property_type] PRIMARY KEY CLUSTERED ([pursuit_type_code] ASC, [prop_type_cd] ASC)
);


GO

