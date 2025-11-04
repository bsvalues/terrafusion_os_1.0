CREATE TABLE [dbo].[current_use_property_run] (
    [run_id]          INT           NOT NULL,
    [year]            NUMERIC (4)   NOT NULL,
    [random]          BIT           NOT NULL,
    [use_codes]       VARCHAR (MAX) NULL,
    [sub_use_codes]   VARCHAR (MAX) NULL,
    [years]           VARCHAR (MAX) NULL,
    [sample_size]     INT           NULL,
    [sample_size_max] INT           NULL,
    [query]           VARCHAR (MAX) NULL,
    [property_ids]    VARCHAR (MAX) NULL,
    [undo_processed]  BIT           NOT NULL,
    [pacs_user_id]    INT           NOT NULL,
    [date_created]    DATETIME      NOT NULL,
    [disallow_undo]   BIT           CONSTRAINT [CDF_current_use_property_run_disallow_undo] DEFAULT ((0)) NOT NULL,
    PRIMARY KEY CLUSTERED ([run_id] ASC),
    FOREIGN KEY ([pacs_user_id]) REFERENCES [dbo].[pacs_user] ([pacs_user_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Whether or not this Selection Run may be undone', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'current_use_property_run', @level2type = N'COLUMN', @level2name = N'disallow_undo';


GO

