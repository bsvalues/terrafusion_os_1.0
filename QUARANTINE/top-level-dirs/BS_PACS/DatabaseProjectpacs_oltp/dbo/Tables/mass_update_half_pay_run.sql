CREATE TABLE [dbo].[mass_update_half_pay_run] (
    [run_id]              INT           NOT NULL,
    [created_by]          INT           NOT NULL,
    [created_date]        DATETIME      NOT NULL,
    [selection_type]      CHAR (2)      NOT NULL,
    [convert_to_half_pay] BIT           NOT NULL,
    [new_h1_date]         DATETIME      NULL,
    [new_h2_date]         DATETIME      NULL,
    [exclude_paid]        BIT           NOT NULL,
    [exclude_rollback]    BIT           NOT NULL,
    [years]               VARCHAR (MAX) NULL,
    [district_list]       VARCHAR (MAX) NULL,
    [agency_list]         VARCHAR (MAX) NULL,
    [fee_type_list]       VARCHAR (MAX) NULL,
    [id_list]             VARCHAR (MAX) NULL,
    [query]               VARCHAR (MAX) NULL,
    [status]              CHAR (1)      NOT NULL,
    [modify_reason]       VARCHAR (500) NULL,
    CONSTRAINT [CPK_mass_update_half_pay_run] PRIMARY KEY CLUSTERED ([run_id] ASC),
    CONSTRAINT [CFK_mass_udpate_half_pay_run_pacs_user] FOREIGN KEY ([created_by]) REFERENCES [dbo].[pacs_user] ([pacs_user_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Comment', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mass_update_half_pay_run', @level2type = N'COLUMN', @level2name = N'modify_reason';


GO

