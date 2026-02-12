CREATE TABLE [dbo].[attribute_value_code] (
    [characteristic_cd] VARCHAR (10)    NOT NULL,
    [attribute_cd]      VARCHAR (20)    NOT NULL,
    [attribute_desc]    VARCHAR (50)    NOT NULL,
    [acres]             NUMERIC (18, 4) NOT NULL,
    CONSTRAINT [CPK_attribute_value_code] PRIMARY KEY CLUSTERED ([characteristic_cd] ASC, [attribute_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

