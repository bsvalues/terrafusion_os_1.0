CREATE TABLE [dbo].[SegmentedChunk] (
    [ChunkId]          UNIQUEIDENTIFIER CONSTRAINT [DF_SegmentedChunk_ChunkId] DEFAULT (newsequentialid()) NOT NULL,
    [SnapshotDataId]   UNIQUEIDENTIFIER NOT NULL,
    [ChunkFlags]       TINYINT          NOT NULL,
    [ChunkName]        NVARCHAR (260)   NOT NULL,
    [ChunkType]        INT              NOT NULL,
    [Version]          SMALLINT         NOT NULL,
    [MimeType]         NVARCHAR (260)   NULL,
    [SegmentedChunkId] BIGINT           IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [PK_SegmentedChunk] PRIMARY KEY CLUSTERED ([SegmentedChunkId] ASC)
);


GO

CREATE UNIQUE NONCLUSTERED INDEX [UNIQ_SnapshotChunkMapping]
    ON [dbo].[SegmentedChunk]([SnapshotDataId] ASC, [ChunkType] ASC, [ChunkName] ASC)
    INCLUDE([ChunkFlags], [ChunkId]);


GO

CREATE NONCLUSTERED INDEX [IX_ChunkId_SnapshotDataId]
    ON [dbo].[SegmentedChunk]([ChunkId] ASC, [SnapshotDataId] ASC);


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[SegmentedChunk] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[SegmentedChunk] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[SegmentedChunk] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[SegmentedChunk] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[SegmentedChunk] TO [RSExecRole]
    AS [dbo];


GO

