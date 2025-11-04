CREATE TABLE [dbo].[litigation] (
    [litigation_id]       INT           NOT NULL,
    [cause_num]           VARCHAR (16)  NOT NULL,
    [court]               VARCHAR (64)  NULL,
    [judge]               VARCHAR (64)  NULL,
    [date_filed]          DATETIME      NULL,
    [trial_date]          DATETIME      NULL,
    [date_certified]      DATETIME      NULL,
    [jury_type]           VARCHAR (10)  NULL,
    [status]              VARCHAR (10)  NULL,
    [reason]              VARCHAR (512) NULL,
    [comments]            VARCHAR (512) NULL,
    [pursuit_status_code] VARCHAR (10)  NULL,
    [pursuit_type_code]   VARCHAR (10)  NOT NULL,
    [collector_id]        INT           NULL,
    CONSTRAINT [CPK_litigation] PRIMARY KEY CLUSTERED ([litigation_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_litigation_collection_pursuit_status] FOREIGN KEY ([pursuit_status_code]) REFERENCES [dbo].[collection_pursuit_status] ([pursuit_status_code]),
    CONSTRAINT [CFK_litigation_collection_pursuit_type] FOREIGN KEY ([pursuit_type_code]) REFERENCES [dbo].[collection_pursuit_type] ([pursuit_type_code]),
    CONSTRAINT [CFK_litigation_collector] FOREIGN KEY ([collector_id]) REFERENCES [dbo].[collector] ([collector_id]),
    CONSTRAINT [CFK_litigation_jury_type] FOREIGN KEY ([jury_type]) REFERENCES [dbo].[litigation_jury_type] ([litigation_jury_type_cd]),
    CONSTRAINT [CFK_litigation_status] FOREIGN KEY ([status]) REFERENCES [dbo].[litigation_status] ([litigation_status_cd])
);


GO

CREATE UNIQUE NONCLUSTERED INDEX [CUQ_litigation_cause_num]
    ON [dbo].[litigation]([cause_num] ASC);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Litigation Collector', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'litigation', @level2type = N'COLUMN', @level2name = N'collector_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'links the litigation with a pursuit type code ', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'litigation', @level2type = N'COLUMN', @level2name = N'pursuit_type_code';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'links the litigation with a pursuit status code ', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'litigation', @level2type = N'COLUMN', @level2name = N'pursuit_status_code';


GO

