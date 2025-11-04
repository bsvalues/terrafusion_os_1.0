CREATE TABLE [dbo].[__penalty_and_interest_backup_1026] (
    [p_and_i_id]                        INT              IDENTITY (1, 1) NOT NULL,
    [type_cd]                           VARCHAR (5)      NOT NULL,
    [percentage]                        NUMERIC (13, 10) NOT NULL,
    [frequency_type_cd]                 VARCHAR (5)      NOT NULL,
    [begin_date]                        DATETIME         NULL,
    [end_date]                          DATETIME         NULL,
    [ref_id]                            INT              NOT NULL,
    [ref_type_cd]                       VARCHAR (5)      NOT NULL,
    [year]                              NUMERIC (4)      NULL,
    [ref_date_type_cd]                  VARCHAR (5)      NULL,
    [ref_date_offset]                   INT              NULL,
    [ref_cd]                            VARCHAR (50)     NULL,
    [fee_type_cd]                       VARCHAR (10)     NULL,
    [begin_date_h2]                     DATETIME         NULL,
    [end_date_h2]                       DATETIME         NULL,
    [ref_date_offset_months]            INT              NULL,
    [penalty_interest_property_type_cd] VARCHAR (10)     NULL
);


GO

