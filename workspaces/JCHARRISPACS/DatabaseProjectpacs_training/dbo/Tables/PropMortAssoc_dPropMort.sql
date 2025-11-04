CREATE TABLE [dbo].[PropMortAssoc_dPropMort] (
    [dPropID]     INT          NULL,
    [dMortID]     INT          NULL,
    [dLoanID]     VARCHAR (25) NULL,
    [NumPropMort] INT          NULL,
    [dRec]        INT          NULL,
    [lKey]        INT          IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [CPK_PropMortAssoc_dPropMort] PRIMARY KEY CLUSTERED ([lKey] ASC) WITH (FILLFACTOR = 100)
);


GO

