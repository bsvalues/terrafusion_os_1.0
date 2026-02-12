CREATE TABLE [dbo].[event] (
    [event_id]                    INT            NOT NULL,
    [system_type]                 CHAR (5)       NULL,
    [event_type]                  CHAR (20)      NOT NULL,
    [event_date]                  DATETIME       NOT NULL,
    [pacs_user]                   VARCHAR (30)   NOT NULL,
    [event_desc]                  VARCHAR (2048) NULL,
    [ref_evt_type]                VARCHAR (20)   NULL,
    [ref_year]                    NUMERIC (4)    NULL,
    [ref_num]                     INT            NULL,
    [ref_id1]                     INT            NULL,
    [ref_id2]                     INT            NULL,
    [ref_id3]                     INT            NULL,
    [ref_id4]                     INT            NULL,
    [ref_id5]                     INT            NULL,
    [ref_id6]                     INT            NULL,
    [pacs_user_id]                INT            NULL,
    [litigation_recheck_date]     DATETIME       NULL,
    [litigation_recheck_complete] BIT            CONSTRAINT [CDF_event_litigation_recheck_complete] DEFAULT ((0)) NULL,
    [attachment]                  BIT            CONSTRAINT [CDF_event_attachment] DEFAULT ((0)) NULL,
    CONSTRAINT [CPK_event] PRIMARY KEY CLUSTERED ([event_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_event_event_type] FOREIGN KEY ([event_type]) REFERENCES [dbo].[event_type] ([event_type_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_ref_id3_event_type_system_type]
    ON [dbo].[event]([ref_id3] ASC, [event_type] ASC, [system_type] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_ref_evt_type]
    ON [dbo].[event]([ref_evt_type] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_ref_id1_ref_year_ref_num]
    ON [dbo].[event]([ref_id1] ASC, [ref_year] ASC, [ref_num] ASC) WITH (FILLFACTOR = 90);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The pacs user id associated to the user that generated the event', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'event', @level2type = N'COLUMN', @level2name = N'pacs_user_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Litigation recheck date.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'event', @level2type = N'COLUMN', @level2name = N'litigation_recheck_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'This column will be used to indicate an event history attachment', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'event', @level2type = N'COLUMN', @level2name = N'attachment';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'litigation recheck complete flag', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'event', @level2type = N'COLUMN', @level2name = N'litigation_recheck_complete';


GO

