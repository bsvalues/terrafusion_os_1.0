CREATE TABLE [dbo].[property_entity_tax_preview] (
    [lPacsUserID]    INT             NOT NULL,
    [lPropValYr]     NUMERIC (4)     NOT NULL,
    [lPropID]        INT             NOT NULL,
    [lOwnerID]       INT             NOT NULL,
    [lSupNum]        INT             NOT NULL,
    [lEntityID]      INT             NOT NULL,
    [szEXCodes]      VARCHAR (255)   NULL,
    [lLocalEx]       NUMERIC (14)    NOT NULL,
    [lStateEx]       NUMERIC (14)    NOT NULL,
    [lTaxable]       NUMERIC (14)    NOT NULL,
    [dTax]           NUMERIC (14, 2) NOT NULL,
    [szFreezeType]   VARCHAR (5)     NULL,
    [lFreezeYear]    NUMERIC (4)     NULL,
    [dFreezeCeiling] NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_property_entity_tax_preview] PRIMARY KEY CLUSTERED ([lPacsUserID] ASC, [lPropID] ASC, [lPropValYr] ASC, [lSupNum] ASC, [lOwnerID] ASC, [lEntityID] ASC) WITH (FILLFACTOR = 60)
);


GO

