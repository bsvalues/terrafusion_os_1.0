CREATE TABLE [dbo].[supp_attribute] (
    [supp_attribute] INT          NOT NULL,
    [attribute]      VARCHAR (35) NOT NULL,
    CONSTRAINT [CPK_supp_attribute] PRIMARY KEY CLUSTERED ([supp_attribute] ASC)
);


GO

