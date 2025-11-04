CREATE TABLE [dbo].[income_sm_worksheet_land_info] (
    [event_id]     INT             NOT NULL,
    [prop_id]      INT             NOT NULL,
    [land_seg_id]  INT             NOT NULL,
    [included]     BIT             NOT NULL,
    [land_type_cd] CHAR (10)       NOT NULL,
    [size_acres]   NUMERIC (18, 4) NOT NULL,
    [value]        NUMERIC (14)    NOT NULL,
    CONSTRAINT [CPK_income_worksheet_land_info] PRIMARY KEY CLUSTERED ([event_id] ASC, [prop_id] ASC, [land_seg_id] ASC),
    CONSTRAINT [CFK_income_sm_worksheet_land_info] FOREIGN KEY ([event_id]) REFERENCES [dbo].[event] ([event_id]),
    CONSTRAINT [CFK_income_sm_worksheet_land_info_land_tpye] FOREIGN KEY ([land_type_cd]) REFERENCES [dbo].[land_type] ([land_type_cd])
);


GO

