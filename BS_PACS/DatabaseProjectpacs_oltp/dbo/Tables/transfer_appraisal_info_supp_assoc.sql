CREATE TABLE [dbo].[transfer_appraisal_info_supp_assoc] (
    [prop_id]      INT         NOT NULL,
    [sup_num]      INT         NOT NULL,
    [owner_tax_yr] NUMERIC (4) NOT NULL,
    CONSTRAINT [CPK_transfer_appraisal_info_supp_assoc] PRIMARY KEY CLUSTERED ([prop_id] ASC, [owner_tax_yr] ASC, [sup_num] ASC) WITH (FILLFACTOR = 100)
);


GO

