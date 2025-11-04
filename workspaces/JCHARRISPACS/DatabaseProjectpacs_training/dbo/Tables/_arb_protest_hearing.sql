CREATE TABLE [dbo].[_arb_protest_hearing] (
    [dtDay]         DATETIME     NOT NULL,
    [cAccountType]  CHAR (1)     NULL,
    [szHearingType] VARCHAR (10) NULL,
    [lHearingID]    INT          NOT NULL,
    CONSTRAINT [CPK__arb_protest_hearing] PRIMARY KEY CLUSTERED ([lHearingID] ASC)
);


GO

