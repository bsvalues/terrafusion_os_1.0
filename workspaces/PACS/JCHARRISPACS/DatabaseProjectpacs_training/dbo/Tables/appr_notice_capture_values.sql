CREATE TABLE [dbo].[appr_notice_capture_values] (
    [prop_val_yr]  NUMERIC (4) NOT NULL,
    [prop_type_cd] CHAR (5)    NOT NULL,
    [date_set]     DATETIME    NULL,
    [pacs_user_id] INT         NOT NULL,
    CONSTRAINT [CPK_appr_notice_capture_values] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [prop_type_cd] ASC, [pacs_user_id] ASC) WITH (FILLFACTOR = 100)
);


GO

