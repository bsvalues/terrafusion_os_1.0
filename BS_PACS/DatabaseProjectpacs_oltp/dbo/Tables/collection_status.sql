CREATE TABLE [dbo].[collection_status] (
    [coll_status_cd]   CHAR (5)     NOT NULL,
    [coll_status_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_collection_status] PRIMARY KEY CLUSTERED ([coll_status_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

