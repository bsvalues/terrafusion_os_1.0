CREATE TABLE [dbo].[arbitration_letter_history] (
    [arbitration_id] INT           NOT NULL,
    [prop_val_yr]    NUMERIC (4)   NOT NULL,
    [history_id]     INT           IDENTITY (1, 1) NOT NULL,
    [letter_id]      INT           NOT NULL,
    [pacs_user_id]   INT           NULL,
    [create_dt]      DATETIME      NULL,
    [letter_path]    VARCHAR (255) NULL,
    CONSTRAINT [CPK_arbitration_letter_history] PRIMARY KEY CLUSTERED ([arbitration_id] ASC, [prop_val_yr] ASC, [history_id] ASC),
    CONSTRAINT [CFK_arbitration_letter_history_arbitration_id_prop_val_yr] FOREIGN KEY ([arbitration_id], [prop_val_yr]) REFERENCES [dbo].[arbitration] ([arbitration_id], [prop_val_yr])
);


GO

