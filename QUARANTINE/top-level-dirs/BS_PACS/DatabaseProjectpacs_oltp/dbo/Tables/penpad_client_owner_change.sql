CREATE TABLE [dbo].[penpad_client_owner_change] (
    [lPropID]      INT          NOT NULL,
    [szFileAsName] VARCHAR (70) NULL,
    CONSTRAINT [CPK_penpad_client_owner_change] PRIMARY KEY CLUSTERED ([lPropID] ASC) WITH (FILLFACTOR = 100)
);


GO

