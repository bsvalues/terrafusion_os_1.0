CREATE TABLE [dbo].[timber_assessed_type] (
    [timber_assessed_type_cd]   VARCHAR (10) NOT NULL,
    [timber_assessed_type_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_timber_assessed_type] PRIMARY KEY CLUSTERED ([timber_assessed_type_cd] ASC)
);


GO

