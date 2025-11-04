CREATE TABLE [dbo].[_arb_letter_history] (
    [lPropValYr]          NUMERIC (4)   NOT NULL,
    [lCaseID]             INT           NOT NULL,
    [szARBType]           VARCHAR (2)   NOT NULL,
    [lLetterID]           INT           NOT NULL,
    [lPacsUserID]         INT           NOT NULL,
    [dtCreate]            DATETIME      NOT NULL,
    [dtMail]              DATETIME      NULL,
    [szAppLocation]       VARCHAR (4)   NOT NULL,
    [szPathLocation]      VARCHAR (256) NOT NULL,
    [lARBLetterHistoryID] INT           IDENTITY (1, 1) NOT NULL,
    [lProtByID]           INT           CONSTRAINT [CDF__arb_letter_history_lProtByID] DEFAULT (0) NOT NULL,
    [lBatchID]            INT           NULL,
    CONSTRAINT [CPK__arb_letter_history] PRIMARY KEY CLUSTERED ([lARBLetterHistoryID] ASC)
);


GO

CREATE NONCLUSTERED INDEX [idx_lPropValYr_lCaseID_szARBType]
    ON [dbo].[_arb_letter_history]([lPropValYr] ASC, [lCaseID] ASC, [szARBType] ASC) WITH (FILLFACTOR = 90);


GO

