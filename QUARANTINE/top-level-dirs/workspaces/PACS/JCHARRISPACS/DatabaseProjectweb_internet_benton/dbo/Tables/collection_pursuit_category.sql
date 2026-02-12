CREATE TABLE [dbo].[collection_pursuit_category] (
    [pursuit_category_code]        VARCHAR (10) NOT NULL,
    [pursuit_category_description] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_collection_pursuit_category] PRIMARY KEY CLUSTERED ([pursuit_category_code] ASC)
);


GO

