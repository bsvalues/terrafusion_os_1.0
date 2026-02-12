CREATE TABLE [dbo].[dor_report_config_stratum] (
    [year]             NUMERIC (4)  NOT NULL,
    [type]             VARCHAR (2)  NOT NULL,
    [stratum_id]       INT          NOT NULL,
    [group_type]       CHAR (1)     NOT NULL,
    [begin_value]      NUMERIC (14) NOT NULL,
    [end_value]        NUMERIC (14) NOT NULL,
    [sample_frequency] INT          NOT NULL,
    [sample_start]     INT          NOT NULL,
    CONSTRAINT [CPK_dor_report_config_stratum] PRIMARY KEY CLUSTERED ([year] ASC, [type] ASC, [stratum_id] ASC)
);


GO

