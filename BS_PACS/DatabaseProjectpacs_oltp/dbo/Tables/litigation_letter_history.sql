CREATE TABLE [dbo].[litigation_letter_history] (
    [history_id]     INT           NOT NULL,
    [litigation_id]  INT           NOT NULL,
    [prop_id]        INT           NOT NULL,
    [lLetterID]      INT           NOT NULL,
    [create_date]    DATETIME      NOT NULL,
    [mail_date]      DATETIME      NOT NULL,
    [pacs_user_id]   INT           NOT NULL,
    [szPathLocation] VARCHAR (256) NOT NULL,
    CONSTRAINT [CPK_litigation_letter_history] PRIMARY KEY CLUSTERED ([history_id] ASC),
    CONSTRAINT [CFK_litigation_letter_history_property] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO

