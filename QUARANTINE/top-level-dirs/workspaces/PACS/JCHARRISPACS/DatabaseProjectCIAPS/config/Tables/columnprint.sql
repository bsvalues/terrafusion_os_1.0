CREATE TABLE [config].[columnprint] (
    [columnprintid]    INT            IDENTITY (1, 1) NOT NULL,
    [columnprint_text] VARCHAR (4000) NULL,
    [ModuleID]         INT            NULL,
    [created]          DATETIME       CONSTRAINT [DF__columnpri__creat__4CA06362] DEFAULT (getdate()) NULL,
    CONSTRAINT [PK__columnpr__A9A7D5B5B041ED76] PRIMARY KEY CLUSTERED ([columnprintid] ASC)
);


GO

