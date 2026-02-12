CREATE TABLE [dbo].[penpad_sales_change] (
    [lRunID]             INT          NOT NULL,
    [lOwnerChangeInfoID] INT          NOT NULL,
    [lPropID]            INT          NOT NULL,
    [bMode]              BIT          NOT NULL,
    [szFileAsName]       VARCHAR (70) NOT NULL,
    [bWizardComplete]    BIT          NULL
);


GO

