CREATE TABLE [dbo].[_ashley_H1_due_irrigation_20230505] (
    [prop_id]                INT             NULL,
    [geo_id]                 VARCHAR (50)    NULL,
    [assessment_description] VARCHAR (50)    NULL,
    [assessment_cd]          VARCHAR (50)    NOT NULL,
    [payment_status_type_cd] VARCHAR (10)    NULL,
    [bill_amt_due]           NUMERIC (15, 2) NULL,
    [h1_due]                 NUMERIC (15, 2) NULL,
    [h2_due]                 NUMERIC (15, 2) NULL,
    [bill_id]                INT             NOT NULL
);


GO

