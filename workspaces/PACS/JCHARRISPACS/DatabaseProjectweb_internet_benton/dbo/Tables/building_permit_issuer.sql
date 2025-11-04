CREATE TABLE [dbo].[building_permit_issuer] (
    [issuer_cd]       VARCHAR (5)   NOT NULL,
    [issuer_desc]     VARCHAR (30)  NULL,
    [url]             VARCHAR (150) NULL,
    [url_description] VARCHAR (32)  NULL,
    CONSTRAINT [CPK_building_permit_issuer] PRIMARY KEY CLUSTERED ([issuer_cd] ASC)
);


GO

