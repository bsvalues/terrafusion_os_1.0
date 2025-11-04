CREATE TABLE [dbo].[lawsuit_suit_type] (
    [suit_type_cd]   VARCHAR (10) NOT NULL,
    [suit_type_desc] VARCHAR (30) NOT NULL,
    CONSTRAINT [CPK_lawsuit_suit_type] PRIMARY KEY CLUSTERED ([suit_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

