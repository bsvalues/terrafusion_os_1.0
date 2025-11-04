CREATE TABLE [dbo].[penpad_owner_change] (
    [lOwnerChangeInfoID] INT          IDENTITY (1, 1) NOT NULL,
    [lRunID]             INT          NOT NULL,
    [lPropID]            INT          NOT NULL,
    [szFileAsName]       VARCHAR (70) NULL,
    [bWizardComplete]    BIT          NULL,
    CONSTRAINT [CPK_penpad_owner_change] PRIMARY KEY CLUSTERED ([lOwnerChangeInfoID] ASC) WITH (FILLFACTOR = 100)
);


GO

