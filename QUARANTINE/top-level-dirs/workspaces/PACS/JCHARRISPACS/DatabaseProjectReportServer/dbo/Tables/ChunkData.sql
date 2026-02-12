CREATE TABLE [dbo].[ChunkData] (
    [ChunkID]        UNIQUEIDENTIFIER NOT NULL,
    [SnapshotDataID] UNIQUEIDENTIFIER NOT NULL,
    [ChunkFlags]     TINYINT          NULL,
    [ChunkName]      NVARCHAR (260)   NULL,
    [ChunkType]      INT              NULL,
    [Version]        SMALLINT         NULL,
    [MimeType]       NVARCHAR (260)   NULL,
    [Content]        IMAGE            NULL,
    CONSTRAINT [PK_ChunkData] PRIMARY KEY NONCLUSTERED ([ChunkID] ASC)
);


GO

CREATE UNIQUE CLUSTERED INDEX [IX_ChunkData]
    ON [dbo].[ChunkData]([SnapshotDataID] ASC, [ChunkType] ASC, [ChunkName] ASC);


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[ChunkData] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[ChunkData] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[ChunkData] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[ChunkData] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[ChunkData] TO [RSExecRole]
    AS [dbo];


GO

