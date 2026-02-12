CREATE TABLE [dbo].[_michelleo_reet_rate_20241003] (
    [tax_district_id]   INT            NOT NULL,
    [reet_rate_id]      INT            NOT NULL,
    [description]       VARCHAR (50)   NULL,
    [reet_rate]         NUMERIC (5, 2) NOT NULL,
    [begin_date]        DATETIME       NULL,
    [end_date]          DATETIME       NULL,
    [is_current]        BIT            NOT NULL,
    [rate_type_cd]      VARCHAR (10)   NULL,
    [resolution_number] INT            NULL,
    [resolution_date]   DATETIME       NULL
);


GO

