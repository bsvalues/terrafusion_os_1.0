CREATE TABLE [dbo].[qe_special_assessment] (
    [report_id]            INT          NOT NULL,
    [agency_id]            INT          NOT NULL,
    [year]                 NUMERIC (4)  NOT NULL,
    [set_assessments_flag] BIT          NOT NULL,
    [column1_title]        VARCHAR (30) NULL,
    [column2_title]        VARCHAR (30) NULL,
    [column3_title]        VARCHAR (30) NULL,
    [column4_title]        VARCHAR (30) NULL,
    CONSTRAINT [CPK_qe_special_assessment] PRIMARY KEY CLUSTERED ([report_id] ASC) WITH (FILLFACTOR = 100)
);


GO

