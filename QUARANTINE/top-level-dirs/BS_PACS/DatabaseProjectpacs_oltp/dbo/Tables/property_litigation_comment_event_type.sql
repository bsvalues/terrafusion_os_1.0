CREATE TABLE [dbo].[property_litigation_comment_event_type] (
    [property_litigation_comment_event_cd]   VARCHAR (20) NOT NULL,
    [property_litigation_comment_event_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_property_litigation_comment_event_type] PRIMARY KEY CLUSTERED ([property_litigation_comment_event_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Stores the types of property litigation comments to be used', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_litigation_comment_event_type';


GO

