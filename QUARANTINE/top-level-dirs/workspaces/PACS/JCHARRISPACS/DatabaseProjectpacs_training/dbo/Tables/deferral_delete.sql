CREATE TABLE [dbo].[deferral_delete] (
    [deferral_id]        INT           NOT NULL,
    [application_number] VARCHAR (25)  NOT NULL,
    [year]               NUMERIC (4)   NOT NULL,
    [prop_id]            INT           NOT NULL,
    [deferral_type]      VARCHAR (25)  NOT NULL,
    [delete_reason]      VARCHAR (255) NOT NULL,
    [delete_dt]          DATETIME      DEFAULT (getdate()) NOT NULL,
    [pacs_user_id]       INT           NOT NULL,
    CONSTRAINT [CPK_deferral_rejection] PRIMARY KEY CLUSTERED ([deferral_id] ASC)
);


GO

