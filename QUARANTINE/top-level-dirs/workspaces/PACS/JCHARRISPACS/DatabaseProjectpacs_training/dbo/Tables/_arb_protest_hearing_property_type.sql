CREATE TABLE [dbo].[_arb_protest_hearing_property_type] (
    [lHearingID]     INT         NOT NULL,
    [szPropertyType] VARCHAR (5) NOT NULL,
    CONSTRAINT [CPK__arb_protest_hearing_property_type] PRIMARY KEY CLUSTERED ([lHearingID] ASC, [szPropertyType] ASC)
);


GO

