CREATE TABLE [import].[files] (
    [fileid]          INT            IDENTITY (1, 1) NOT NULL,
    [filelocation]    VARCHAR (4000) NOT NULL,
    [filename]        VARCHAR (4000) NOT NULL,
    [columnprintid]   INT            NULL,
    [locationcreated] DATETIME       NOT NULL,
    [created]         DATETIME       CONSTRAINT [DF__files__created__3A81B327] DEFAULT (getdate()) NOT NULL,
    [firstdate]       DATETIME       NOT NULL,
    [recentdate]      DATETIME       NOT NULL,
    CONSTRAINT [PK__files__C2C7C244A2126352] PRIMARY KEY CLUSTERED ([fileid] ASC)
);


GO

