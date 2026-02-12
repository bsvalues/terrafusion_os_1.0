CREATE TABLE [dbo].[fin_event_code] (
    [event_cd]          VARCHAR (15) NOT NULL,
    [event_description] VARCHAR (50) NOT NULL,
    [event_panel_cd]    VARCHAR (10) NOT NULL,
    [allow_multiple]    BIT          NULL,
    [mapped_column]     VARCHAR (50) NULL,
    [enabled]           BIT          NULL,
    CONSTRAINT [CPK_fin_event_code] PRIMARY KEY CLUSTERED ([event_cd] ASC)
);


GO

