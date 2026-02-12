CREATE TABLE [dbo].[_rbk_psa] (
    [prop_id]                           INT           NULL,
    [sup_num]                           INT           NULL,
    [statement_id]                      INT           NULL,
    [col_owner_id]                      INT           NULL,
    [suppress_notice_prior_year_values] BIT           NULL,
    [tax_area_number]                   VARCHAR (23)  NULL,
    [geo_id]                            VARCHAR (50)  NULL,
    [file_as_name]                      VARCHAR (70)  NULL,
    [legal_desc]                        VARCHAR (255) NULL,
    [sup_desc]                          VARCHAR (500) NULL,
    [is_additional_statement]           BIT           NULL
);


GO

