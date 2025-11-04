CREATE TABLE [config].[columnprintmapping] (
    [columnprintmapid]      INT            IDENTITY (1, 1) NOT NULL,
    [columnprintid]         INT            NOT NULL,
    [filecolumnname]        VARCHAR (4000) NULL,
    [destinationcolumnname] VARCHAR (4000) NULL,
    [created]               DATETIME       CONSTRAINT [DF__columnpri__creat__1367E606] DEFAULT (getdate()) NULL,
    [updated]               DATETIME       CONSTRAINT [DF__columnpri__updat__145C0A3F] DEFAULT (getdate()) NULL,
    [enabled]               BIT            CONSTRAINT [DF__columnpri__enabl__15502E78] DEFAULT ((1)) NULL,
    CONSTRAINT [PK__columnpr__39A6FCED694B5DF8] PRIMARY KEY CLUSTERED ([columnprintmapid] ASC)
);


GO

