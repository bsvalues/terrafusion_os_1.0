CREATE TABLE [dbo].[import_shared_prop_match] (
    [lRunId]             INT           NOT NULL,
    [lRecordId]          INT           NOT NULL,
    [lPACSPropId]        INT           NOT NULL,
    [szCADPropId]        VARCHAR (35)  NOT NULL,
    [szGeoId]            VARCHAR (50)  NULL,
    [szLegalDescription] VARCHAR (200) NULL,
    [szOwnerName]        VARCHAR (70)  NOT NULL,
    [szValueMethod]      VARCHAR (1)   NULL,
    [fCADMarket]         NUMERIC (14)  NOT NULL,
    [fOverlapCADMarket]  NUMERIC (14)  NOT NULL,
    [fDifference]        NUMERIC (14)  NOT NULL,
    CONSTRAINT [CPK_import_shared_prop_match] PRIMARY KEY CLUSTERED ([lRunId] ASC, [lRecordId] ASC) WITH (FILLFACTOR = 90)
);


GO

