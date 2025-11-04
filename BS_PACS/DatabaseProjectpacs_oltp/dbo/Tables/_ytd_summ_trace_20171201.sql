CREATE TABLE [dbo].[_ytd_summ_trace_20171201] (
    [RowNumber]       INT            IDENTITY (0, 1) NOT NULL,
    [EventClass]      INT            NULL,
    [TextData]        NTEXT          NULL,
    [ApplicationName] NVARCHAR (128) NULL,
    [NTUserName]      NVARCHAR (128) NULL,
    [LoginName]       NVARCHAR (128) NULL,
    [CPU]             INT            NULL,
    [Reads]           BIGINT         NULL,
    [Writes]          BIGINT         NULL,
    [Duration]        BIGINT         NULL,
    [ClientProcessID] INT            NULL,
    [SPID]            INT            NULL,
    [StartTime]       DATETIME       NULL,
    [EndTime]         DATETIME       NULL,
    [BinaryData]      IMAGE          NULL,
    PRIMARY KEY CLUSTERED ([RowNumber] ASC)
);


GO

