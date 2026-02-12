CREATE TYPE [internal].[machine_property_list_type] AS TABLE (
    [PropertyName]  NVARCHAR (MAX) NOT NULL,
    [PropertyValue] NVARCHAR (MAX) NULL);


GO

GRANT EXECUTE
    ON TYPE::[internal].[machine_property_list_type] TO PUBLIC;


GO

