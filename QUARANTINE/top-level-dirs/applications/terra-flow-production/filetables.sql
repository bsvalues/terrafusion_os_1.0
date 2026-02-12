CREATE TABLE [import].[filetables] (
    [filetableid]          INT            IDENTITY (1, 1) NOT NULL,
    [fileid]               INT            NULL,
    [tablename]            VARCHAR (4000) NULL,
    [created]              DATETIME       CONSTRAINT [DF__filetable__creat__1B0907CE] DEFAULT (getdate()) NULL,
    [recordcount]          BIGINT         NULL,
    [processedrecordcount] BIGINT         NULL,
    [Processed]            DATETIME       CONSTRAINT [DF__filetable__Proce__1BFD2C07] DEFAULT (getdate()) NULL,
    CONSTRAINT [PK__filetabl__B84D01152B09A02D] PRIMARY KEY CLUSTERED ([filetableid] ASC),
    CONSTRAINT [FK__filetable__filei__3C69FB99] FOREIGN KEY ([fileid]) REFERENCES [import].[files] ([fileid])
);


GO

