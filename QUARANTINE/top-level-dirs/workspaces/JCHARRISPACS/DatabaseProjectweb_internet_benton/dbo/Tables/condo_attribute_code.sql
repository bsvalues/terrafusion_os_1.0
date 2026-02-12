CREATE TABLE [dbo].[condo_attribute_code] (
    [attribute_cd]      VARCHAR (10) NOT NULL,
    [attribute_desc]    VARCHAR (50) NOT NULL,
    [characteristic_cd] VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_condo_attribute_code] PRIMARY KEY CLUSTERED ([characteristic_cd] ASC, [attribute_cd] ASC)
);


GO

