CREATE TABLE [dbo].[litigation_prop_assoc] (
    [litigation_id]     INT           NOT NULL,
    [prop_id]           INT           NOT NULL,
    [bankruptcy_num]    VARCHAR (16)  NULL,
    [bankruptcy_status] VARCHAR (10)  NULL,
    [file_number]       VARCHAR (50)  NULL,
    [date_filed]        DATETIME      NULL,
    [court]             VARCHAR (64)  NULL,
    [judge]             VARCHAR (64)  NULL,
    [reason]            VARCHAR (512) NULL,
    [trial_date]        DATETIME      NULL,
    [status]            VARCHAR (10)  NULL,
    [contact_id]        INT           NULL,
    [attorney_id]       INT           NULL,
    [trustee_id]        INT           NULL,
    CONSTRAINT [CPK_litigation_prop_assoc] PRIMARY KEY CLUSTERED ([litigation_id] ASC, [prop_id] ASC),
    CONSTRAINT [CFK_litigation_prop_assoc_bankruptcy_status] FOREIGN KEY ([bankruptcy_status]) REFERENCES [dbo].[litigation_bankruptcy_status] ([bankruptcy_status_cd]),
    CONSTRAINT [CFK_litigation_prop_assoc_litigation] FOREIGN KEY ([litigation_id]) REFERENCES [dbo].[litigation] ([litigation_id]),
    CONSTRAINT [CFK_litigation_prop_assoc_status] FOREIGN KEY ([status]) REFERENCES [dbo].[litigation_status] ([litigation_status_cd])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Bankruptcy status', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'litigation_prop_assoc', @level2type = N'COLUMN', @level2name = N'bankruptcy_status';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Judge', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'litigation_prop_assoc', @level2type = N'COLUMN', @level2name = N'judge';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'File number', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'litigation_prop_assoc', @level2type = N'COLUMN', @level2name = N'file_number';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Contact account ID number', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'litigation_prop_assoc', @level2type = N'COLUMN', @level2name = N'contact_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Reason', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'litigation_prop_assoc', @level2type = N'COLUMN', @level2name = N'reason';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The date on which the litigation was filed', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'litigation_prop_assoc', @level2type = N'COLUMN', @level2name = N'date_filed';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Attorney account ID number', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'litigation_prop_assoc', @level2type = N'COLUMN', @level2name = N'attorney_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Bankruptcy number', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'litigation_prop_assoc', @level2type = N'COLUMN', @level2name = N'bankruptcy_num';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Trial date', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'litigation_prop_assoc', @level2type = N'COLUMN', @level2name = N'trial_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Court', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'litigation_prop_assoc', @level2type = N'COLUMN', @level2name = N'court';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Trustee account ID number', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'litigation_prop_assoc', @level2type = N'COLUMN', @level2name = N'trustee_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Status', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'litigation_prop_assoc', @level2type = N'COLUMN', @level2name = N'status';


GO

