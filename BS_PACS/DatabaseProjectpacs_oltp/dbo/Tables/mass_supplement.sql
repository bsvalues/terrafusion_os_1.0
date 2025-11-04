CREATE TABLE [dbo].[mass_supplement] (
    [mm_id]                INT NOT NULL,
    [prop_id]              INT NOT NULL,
    [sup_group_id]         INT NOT NULL,
    [sup_num]              INT NOT NULL,
    [already_supplemented] BIT NOT NULL,
    CONSTRAINT [CPK_mass_supplement] PRIMARY KEY CLUSTERED ([mm_id] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90)
);


GO

