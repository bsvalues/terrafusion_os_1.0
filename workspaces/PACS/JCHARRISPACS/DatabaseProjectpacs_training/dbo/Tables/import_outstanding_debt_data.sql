CREATE TABLE [dbo].[import_outstanding_debt_data] (
    [import_id]         INT             NOT NULL,
    [import_file_id]    INT             NOT NULL,
    [import_data_id]    INT             NOT NULL,
    [import_levy_code]  VARCHAR (10)    NULL,
    [import_amt]        NUMERIC (14, 2) NOT NULL,
    [import_as_of_date] DATETIME        NOT NULL,
    [matched_levy_code] VARCHAR (10)    NULL,
    [status]            CHAR (1)        NOT NULL
);


GO

