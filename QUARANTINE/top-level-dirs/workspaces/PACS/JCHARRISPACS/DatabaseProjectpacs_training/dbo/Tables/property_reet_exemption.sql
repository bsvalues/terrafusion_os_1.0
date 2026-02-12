CREATE TABLE [dbo].[property_reet_exemption] (
    [reet_id]                INT          NOT NULL,
    [year]                   NUMERIC (4)  NOT NULL,
    [sup_num]                INT          NOT NULL,
    [prop_id]                INT          NOT NULL,
    [exmpt_type_cd]          VARCHAR (10) NOT NULL,
    [remove_exemption]       BIT          CONSTRAINT [CDF_property_reet_exemption_remove_exemption] DEFAULT ((0)) NOT NULL,
    [last_update_by_user_id] INT          NULL,
    [last_update_date]       DATETIME     NULL,
    CONSTRAINT [CPK_property_reet_exemption] PRIMARY KEY CLUSTERED ([year] ASC, [sup_num] ASC, [prop_id] ASC, [reet_id] ASC, [exmpt_type_cd] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_property_reet_exemption_year_sup_num_prop_id_reet_id] FOREIGN KEY ([year], [sup_num], [prop_id], [reet_id]) REFERENCES [dbo].[property_reet_assoc] ([year], [sup_num], [prop_id], [reet_id]) ON DELETE CASCADE
);


GO

