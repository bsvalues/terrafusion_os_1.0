CREATE TABLE [dbo].[taxableValueTCA] (
    [value_type]      VARCHAR (5)  NOT NULL,
    [property_id]     INT          NOT NULL,
    [tax_year]        VARCHAR (4)  NOT NULL,
    [initial_value]   DECIMAL (10) NULL,
    [initial_date]    DATETIME     NULL,
    [modified_value]  DECIMAL (10) NULL,
    [modified_date]   DATETIME     NULL,
    [prop_segment_id] INT          NOT NULL,
    [MKTTL]           DECIMAL (10) NULL,
    [tax_area]        VARCHAR (23) NULL
);


GO

