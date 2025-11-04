CREATE TABLE [dbo].[exemption_review_run] (
    [run_id]               INT            NOT NULL,
    [year]                 NUMERIC (4)    NOT NULL,
    [letters_printed]      BIT            DEFAULT ((0)) NOT NULL,
    [templates_printed]    BIT            DEFAULT ((0)) NOT NULL,
    [created_date]         DATETIME       NOT NULL,
    [created_by_id]        INT            NOT NULL,
    [type_flag]            CHAR (1)       NOT NULL,
    [criteria_type_flag]   CHAR (1)       NOT NULL,
    [begin_ownership_date] DATETIME       NULL,
    [end_ownership_date]   DATETIME       NULL,
    [qualify_year]         NUMERIC (4)    NULL,
    [review_year]          NUMERIC (4)    NULL,
    [query]                VARCHAR (4000) NULL,
    [review_request_date]  DATETIME       NULL,
    [review_status_cd]     VARCHAR (10)   NULL,
    [review_comment]       VARCHAR (100)  NULL,
    [set_information_flag] BIT            DEFAULT ((0)) NOT NULL,
    [template_id]          INT            NULL,
    [letter_id]            INT            NULL,
    CONSTRAINT [CPK_exemption_review_run] PRIMARY KEY CLUSTERED ([run_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_exemption_review_run_exemption_renewal_status] FOREIGN KEY ([review_status_cd]) REFERENCES [dbo].[exemption_renewal_status] ([code])
);


GO

