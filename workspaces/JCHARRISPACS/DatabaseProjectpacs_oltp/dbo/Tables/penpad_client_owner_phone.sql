CREATE TABLE [dbo].[penpad_client_owner_phone] (
    [lOwnerChangeInfoPhoneID] INT          IDENTITY (1, 1) NOT NULL,
    [lPropID]                 INT          NOT NULL,
    [szPhoneTypeCode]         CHAR (5)     NOT NULL,
    [szPhoneNumber]           VARCHAR (20) NULL,
    CONSTRAINT [CPK_penpad_client_owner_phone] PRIMARY KEY CLUSTERED ([lOwnerChangeInfoPhoneID] ASC) WITH (FILLFACTOR = 100)
);


GO

