CREATE TABLE [dbo].[PropMortAssoc_data] (
    [recNo]    INT          IDENTITY (1, 1) NOT NULL,
    [parcelID] VARCHAR (25) NULL,
    [lenderNo] VARCHAR (10) NULL,
    [loanID]   VARCHAR (25) NULL,
    CONSTRAINT [CPK_PropMortAssoc_data] PRIMARY KEY CLUSTERED ([recNo] ASC) WITH (FILLFACTOR = 100)
);


GO

