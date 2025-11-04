CREATE TABLE [dbo].[value_cert_notice] (
    [pacs_user_id]       INT           NOT NULL,
    [prop_id]            INT           NOT NULL,
    [sup_num]            INT           NOT NULL,
    [owner_id]           INT           NOT NULL,
    [geo_id]             VARCHAR (50)  NULL,
    [situs_display]      VARCHAR (140) NULL,
    [legal_desc]         VARCHAR (255) NULL,
    [entities]           VARCHAR (100) NULL,
    [exemptions]         VARCHAR (100) NULL,
    [owner_name]         VARCHAR (50)  NULL,
    [address_line1]      VARCHAR (60)  NULL,
    [address_line2]      VARCHAR (60)  NULL,
    [address_line3]      VARCHAR (60)  NULL,
    [address_city]       VARCHAR (50)  NULL,
    [address_state]      VARCHAR (50)  NULL,
    [address_zip]        VARCHAR (50)  NULL,
    [certification_year] VARCHAR (10)  NOT NULL,
    CONSTRAINT [CPK_value_cert_notice] PRIMARY KEY CLUSTERED ([prop_id] ASC, [certification_year] ASC, [sup_num] ASC, [owner_id] ASC, [pacs_user_id] ASC) WITH (FILLFACTOR = 100)
);


GO

