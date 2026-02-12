CREATE TABLE [dbo].[appr_notice_prop_list_shared_cad] (
    [notice_yr]      NUMERIC (4)  NOT NULL,
    [notice_num]     INT          NOT NULL,
    [prop_id]        INT          NOT NULL,
    [owner_id]       INT          NOT NULL,
    [sup_num]        INT          NOT NULL,
    [sup_yr]         NUMERIC (4)  NOT NULL,
    [CAD_code]       VARCHAR (5)  NOT NULL,
    [CAD_desc]       VARCHAR (50) NULL,
    [CAD_addr_line1] VARCHAR (50) NULL,
    [CAD_addr_line2] VARCHAR (50) NULL,
    [CAD_addr_line3] VARCHAR (50) NULL,
    [CAD_addr_city]  VARCHAR (50) NULL,
    [CAD_addr_state] CHAR (2)     NULL,
    [CAD_addr_zip]   VARCHAR (50) NULL,
    [CAD_phone_num]  VARCHAR (50) NULL
);


GO

CREATE CLUSTERED INDEX [idx_notice_yr_notice_num_prop_id_sup_num_sup_yr_owner_id_CAD_code]
    ON [dbo].[appr_notice_prop_list_shared_cad]([notice_yr] ASC, [notice_num] ASC, [prop_id] ASC, [sup_num] ASC, [sup_yr] ASC, [owner_id] ASC, [CAD_code] ASC) WITH (FILLFACTOR = 100);


GO

