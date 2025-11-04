CREATE TABLE [dbo].[bp_issuer_status_cd] (
    [IssuerStatus] VARCHAR (5)  NOT NULL,
    [Description]  VARCHAR (50) NULL,
    CONSTRAINT [CPK_bp_issuer_status_cd] PRIMARY KEY CLUSTERED ([IssuerStatus] ASC) WITH (FILLFACTOR = 100)
);


GO

