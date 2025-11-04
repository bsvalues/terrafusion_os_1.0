CREATE TABLE [dbo].[__importpi_4_penalty_and_interest] (
    [type_cd]                           VARCHAR (5)      NOT NULL,
    [percentage]                        NUMERIC (13, 10) NOT NULL,
    [frequency_type_cd]                 VARCHAR (5)      NOT NULL,
    [begin_date]                        DATETIME         NULL,
    [end_date]                          DATETIME         NULL,
    [ref_id_unused]                     INT              NULL,
    [ref_type_cd]                       VARCHAR (5)      NOT NULL,
    [year]                              NUMERIC (4)      NULL,
    [penalty_interest_property_type_cd] VARCHAR (10)     NULL
);


GO

