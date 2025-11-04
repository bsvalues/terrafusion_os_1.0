CREATE TABLE [dbo].[pp_appr_meth_cd] (
    [meth_code]        CHAR (4)     NOT NULL,
    [meth_description] VARCHAR (15) NULL,
    [seg_type]         CHAR (2)     NOT NULL,
    [is_default]       CHAR (1)     NULL,
    CONSTRAINT [CPK_pp_appr_meth_cd] PRIMARY KEY CLUSTERED ([meth_code] ASC, [seg_type] ASC) WITH (FILLFACTOR = 100)
);


GO

