CREATE TABLE [dbo].[litigation_status] (
    [litigation_status_cd]   VARCHAR (10) NOT NULL,
    [litigation_status_desc] VARCHAR (64) NOT NULL,
    CONSTRAINT [CPK_litigation_status] PRIMARY KEY CLUSTERED ([litigation_status_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

