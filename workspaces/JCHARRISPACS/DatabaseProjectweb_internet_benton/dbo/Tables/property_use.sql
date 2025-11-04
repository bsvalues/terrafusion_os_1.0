CREATE TABLE [dbo].[property_use] (
    [property_use_cd]   VARCHAR (10) NOT NULL,
    [property_use_desc] VARCHAR (50) NOT NULL,
    [dor_use_code]      VARCHAR (10) NULL,
    CONSTRAINT [CPK_property_use] PRIMARY KEY CLUSTERED ([property_use_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

