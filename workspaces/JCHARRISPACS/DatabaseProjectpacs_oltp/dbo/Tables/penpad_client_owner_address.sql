CREATE TABLE [dbo].[penpad_client_owner_address] (
    [lOwnerChangeInfoAddressID] INT          IDENTITY (1, 1) NOT NULL,
    [lPropID]                   INT          NOT NULL,
    [szAddressTypeCode]         CHAR (5)     NOT NULL,
    [szPrimaryAddress]          CHAR (1)     NOT NULL,
    [szLine1]                   VARCHAR (60) NULL,
    [szLine2]                   VARCHAR (60) NULL,
    [szLine3]                   VARCHAR (60) NULL,
    [szCity]                    VARCHAR (50) NULL,
    [szState]                   VARCHAR (50) NULL,
    [szCountry]                 CHAR (5)     NULL,
    [szZIP]                     VARCHAR (5)  NULL,
    [szCASS]                    VARCHAR (4)  NULL,
    CONSTRAINT [CPK_penpad_client_owner_address] PRIMARY KEY CLUSTERED ([lPropID] ASC, [szAddressTypeCode] ASC) WITH (FILLFACTOR = 100)
);


GO

