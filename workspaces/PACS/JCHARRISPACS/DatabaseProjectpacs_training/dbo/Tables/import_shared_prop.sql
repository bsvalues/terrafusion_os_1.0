CREATE TABLE [dbo].[import_shared_prop] (
    [lRunId]                        INT           IDENTITY (1, 1) NOT NULL,
    [szStatus]                      VARCHAR (1)   NOT NULL,
    [dtStatus]                      DATETIME      NOT NULL,
    [szImportUser]                  VARCHAR (30)  NOT NULL,
    [szMatchUser]                   VARCHAR (30)  NULL,
    [szCADCode]                     VARCHAR (5)   NOT NULL,
    [szFilePath]                    VARCHAR (255) NOT NULL,
    [szFileFormat]                  VARCHAR (3)   NOT NULL,
    [lYear]                         INT           NOT NULL,
    [lSupplement]                   INT           NULL,
    [lNumRecords]                   INT           NOT NULL,
    [fTotalMarket]                  NUMERIC (14)  NULL,
    [fTotalAppraised]               NUMERIC (14)  NULL,
    [lNumMatches]                   INT           NULL,
    [lNumWarnings]                  INT           NULL,
    [lNumErrors]                    INT           NULL,
    [bMissingOverlapCADData]        BIT           NULL,
    [bMultipleCADProperties]        BIT           NULL,
    [bMultipleOverlapCADProperties] BIT           NULL,
    [bNoCADProperty]                BIT           NULL,
    CONSTRAINT [CPK_import_shared_prop] PRIMARY KEY CLUSTERED ([lRunId] ASC) WITH (FILLFACTOR = 90)
);


GO

