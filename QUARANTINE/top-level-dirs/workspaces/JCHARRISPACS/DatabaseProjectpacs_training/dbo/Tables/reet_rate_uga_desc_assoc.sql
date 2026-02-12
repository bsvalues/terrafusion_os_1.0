CREATE TABLE [dbo].[reet_rate_uga_desc_assoc] (
    [reet_rate_id]     INT            NOT NULL,
    [tax_district_id]  INT            NOT NULL,
    [uga_indicator_cd] VARCHAR (10)   NOT NULL,
    [description]      VARCHAR (50)   NOT NULL,
    [percentage]       NUMERIC (5, 2) NULL,
    [event_cd]         VARCHAR (15)   NOT NULL,
    CONSTRAINT [CPK_reet_rate_uga_desc_assoc] PRIMARY KEY CLUSTERED ([reet_rate_id] ASC, [tax_district_id] ASC, [uga_indicator_cd] ASC, [description] ASC, [event_cd] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'code from fin_event_code to distinquish rows specific to a certain event code in reet event mapping', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet_rate_uga_desc_assoc', @level2type = N'COLUMN', @level2name = N'event_cd';


GO

