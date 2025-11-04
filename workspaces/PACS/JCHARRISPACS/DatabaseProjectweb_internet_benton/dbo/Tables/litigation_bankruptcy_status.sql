CREATE TABLE [dbo].[litigation_bankruptcy_status] (
    [bankruptcy_status_cd]   VARCHAR (10) NOT NULL,
    [bankruptcy_status_desc] VARCHAR (64) NOT NULL,
    CONSTRAINT [CPK_litigation_bankruptcy_status] PRIMARY KEY CLUSTERED ([bankruptcy_status_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

