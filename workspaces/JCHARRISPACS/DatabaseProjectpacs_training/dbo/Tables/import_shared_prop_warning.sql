CREATE TABLE [dbo].[import_shared_prop_warning] (
    [lRunId]             INT           NOT NULL,
    [lWarningId]         INT           IDENTITY (1, 1) NOT NULL,
    [lPACSPropId]        INT           NULL,
    [szCADPropId]        VARCHAR (35)  NULL,
    [szGeoId]            VARCHAR (50)  NULL,
    [szLegalDescription] VARCHAR (200) NULL,
    [szOwnerName]        VARCHAR (70)  NULL,
    [szDescription]      VARCHAR (255) NULL,
    CONSTRAINT [CPK_import_shared_prop_warning] PRIMARY KEY CLUSTERED ([lRunId] ASC, [lWarningId] ASC) WITH (FILLFACTOR = 90)
);


GO

