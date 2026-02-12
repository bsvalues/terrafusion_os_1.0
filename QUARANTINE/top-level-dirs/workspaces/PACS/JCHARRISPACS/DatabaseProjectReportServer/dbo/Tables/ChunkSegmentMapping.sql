CREATE TABLE [dbo].[ChunkSegmentMapping] (
    [ChunkId]          UNIQUEIDENTIFIER NOT NULL,
    [SegmentId]        UNIQUEIDENTIFIER NOT NULL,
    [StartByte]        BIGINT           NOT NULL,
    [LogicalByteCount] INT              NOT NULL,
    [ActualByteCount]  INT              NOT NULL,
    CONSTRAINT [PK_ChunkSegmentMapping] PRIMARY KEY CLUSTERED ([ChunkId] ASC, [SegmentId] ASC),
    CONSTRAINT [Positive_ActualByteCount] CHECK ([ActualByteCount]>=(0)),
    CONSTRAINT [Positive_LogicalByteCount] CHECK ([LogicalByteCount]>=(0)),
    CONSTRAINT [Positive_StartByte] CHECK ([StartByte]>=(0))
);


GO

CREATE NONCLUSTERED INDEX [IX_ChunkSegmentMapping_SegmentId]
    ON [dbo].[ChunkSegmentMapping]([SegmentId] ASC);


GO

CREATE UNIQUE NONCLUSTERED INDEX [UNIQ_ChunkId_StartByte]
    ON [dbo].[ChunkSegmentMapping]([ChunkId] ASC, [StartByte] ASC)
    INCLUDE([ActualByteCount], [LogicalByteCount]);


GO

GRANT INSERT
    ON OBJECT::[dbo].[ChunkSegmentMapping] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[ChunkSegmentMapping] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[ChunkSegmentMapping] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[ChunkSegmentMapping] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[ChunkSegmentMapping] TO [RSExecRole]
    AS [dbo];


GO

