CREATE TABLE [dbo].[reportsort] (
    [report_id]         INT           IDENTITY (1, 1) NOT NULL,
    [sort_support_flag] INT           NULL,
    [reportFileName]    VARCHAR (255) NOT NULL,
    [AlphaSort]         VARCHAR (255) NULL,
    [GeoIDSort]         VARCHAR (255) NULL,
    [ZipSort]           VARCHAR (255) NULL,
    [ZipBarcodeSort]    VARCHAR (255) NULL,
    CONSTRAINT [CPK_reportsort] PRIMARY KEY CLUSTERED ([report_id] ASC) WITH (FILLFACTOR = 100)
);


GO

