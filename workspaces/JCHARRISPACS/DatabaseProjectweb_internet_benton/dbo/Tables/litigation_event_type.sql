CREATE TABLE [dbo].[litigation_event_type] (
    [litigation_event_cd]   VARCHAR (10) NOT NULL,
    [litigation_event_desc] VARCHAR (50) NOT NULL,
    [show_at_prop_level]    BIT          NOT NULL,
    [prop_level_event_cd]   CHAR (20)    NULL,
    [default_recheck_days]  INT          NULL,
    CONSTRAINT [CPK_litigation_event_type] PRIMARY KEY CLUSTERED ([litigation_event_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

