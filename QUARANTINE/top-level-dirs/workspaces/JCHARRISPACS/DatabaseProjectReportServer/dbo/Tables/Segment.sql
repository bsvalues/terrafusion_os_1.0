CREATE TABLE [dbo].[Segment] (
    [SegmentId] UNIQUEIDENTIFIER CONSTRAINT [DF_Segment_SegmentId] DEFAULT (newsequentialid()) NOT NULL,
    [Content]   VARBINARY (MAX)  NULL,
    CONSTRAINT [PK_Segment] PRIMARY KEY CLUSTERED ([SegmentId] ASC)
);


GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_SegmentMetadata]
    ON [dbo].[Segment]([SegmentId] ASC);


GO

GRANT INSERT
    ON OBJECT::[dbo].[Segment] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[Segment] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[Segment] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[Segment] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[Segment] TO [RSExecRole]
    AS [dbo];


GO

