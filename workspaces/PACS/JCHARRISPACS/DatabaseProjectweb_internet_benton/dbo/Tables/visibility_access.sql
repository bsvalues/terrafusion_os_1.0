CREATE TABLE [dbo].[visibility_access] (
    [visibility_access_cd]   VARCHAR (10) NOT NULL,
    [visibility_access_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_visibility_access] PRIMARY KEY CLUSTERED ([visibility_access_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

