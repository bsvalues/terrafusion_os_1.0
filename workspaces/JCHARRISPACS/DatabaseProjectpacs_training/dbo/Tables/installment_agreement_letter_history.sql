CREATE TABLE [dbo].[installment_agreement_letter_history] (
    [ia_id]         INT           NOT NULL,
    [letter_id]     INT           NOT NULL,
    [pacs_user_id]  INT           NOT NULL,
    [create_dt]     DATETIME      NOT NULL,
    [app_location]  VARCHAR (4)   NOT NULL,
    [path_location] VARCHAR (256) NOT NULL,
    [lIALetterID]   INT           IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [CPK_installment_agreement_letter_history] PRIMARY KEY CLUSTERED ([lIALetterID] ASC) WITH (FILLFACTOR = 100)
);


GO

CREATE NONCLUSTERED INDEX [idx_ia_id]
    ON [dbo].[installment_agreement_letter_history]([ia_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_letter_id]
    ON [dbo].[installment_agreement_letter_history]([letter_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_pacs_user_id]
    ON [dbo].[installment_agreement_letter_history]([pacs_user_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_create_dt]
    ON [dbo].[installment_agreement_letter_history]([create_dt] ASC) WITH (FILLFACTOR = 90);


GO

