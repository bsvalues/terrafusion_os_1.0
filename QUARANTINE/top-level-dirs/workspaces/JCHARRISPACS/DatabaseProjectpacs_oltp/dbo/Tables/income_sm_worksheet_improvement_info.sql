CREATE TABLE [dbo].[income_sm_worksheet_improvement_info] (
    [event_id]      INT           NOT NULL,
    [imprv_id]      INT           NOT NULL,
    [included]      BIT           NOT NULL,
    [imprv_type_cd] CHAR (5)      NOT NULL,
    [value]         NUMERIC (14)  NOT NULL,
    [imprv_desc]    VARCHAR (255) NULL,
    CONSTRAINT [CPK_income_sm_worksheet_improvement_info] PRIMARY KEY CLUSTERED ([event_id] ASC, [imprv_id] ASC),
    CONSTRAINT [CFK_income_sm_worksheet_improvement_info] FOREIGN KEY ([event_id]) REFERENCES [dbo].[event] ([event_id]),
    CONSTRAINT [CFK_income_sm_worksheet_improvement_info_imprv_type] FOREIGN KEY ([imprv_type_cd]) REFERENCES [dbo].[imprv_type] ([imprv_type_cd])
);


GO

