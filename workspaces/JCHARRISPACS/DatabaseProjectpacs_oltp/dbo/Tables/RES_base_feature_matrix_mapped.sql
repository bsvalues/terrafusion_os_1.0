CREATE TABLE [dbo].[RES_base_feature_matrix_mapped] (
    [tbl_element]      CHAR (12)    NULL,
    [tbl_element_desc] CHAR (30)    NULL,
    [num_1]            INT          NOT NULL,
    [code_status]      CHAR (1)     NULL,
    [class]            VARCHAR (55) NULL,
    [feature]          CHAR (8)     NULL,
    [rate]             INT          NOT NULL,
    [matrix_name]      VARCHAR (55) NULL,
    [matrix_id]        VARCHAR (55) NULL
);


GO

