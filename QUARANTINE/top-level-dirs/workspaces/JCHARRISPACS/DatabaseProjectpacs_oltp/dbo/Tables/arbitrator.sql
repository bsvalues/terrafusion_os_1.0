CREATE TABLE [dbo].[arbitrator] (
    [arbitrator_id] INT          NOT NULL,
    [arbitrator_cd] VARCHAR (10) NULL,
    CONSTRAINT [CPK_arbitrator] PRIMARY KEY CLUSTERED ([arbitrator_id] ASC),
    CONSTRAINT [CFK_arbitrator_arbitrator_id] FOREIGN KEY ([arbitrator_id]) REFERENCES [dbo].[account] ([acct_id])
);


GO

