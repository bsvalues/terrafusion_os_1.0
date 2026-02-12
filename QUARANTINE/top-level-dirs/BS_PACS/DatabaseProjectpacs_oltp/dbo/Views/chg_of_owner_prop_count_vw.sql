
create view chg_of_owner_prop_count_vw
with schemabinding

as

	select
		coopa.chg_of_owner_id,
		count_big(*) as prop_count
	from dbo.chg_of_owner_prop_assoc as coopa
	group by
		coopa.chg_of_owner_id

GO

CREATE UNIQUE CLUSTERED INDEX [idx_chg_of_owner_prop_count_vw]
    ON [dbo].[chg_of_owner_prop_count_vw]([chg_of_owner_id] ASC) WITH (FILLFACTOR = 90);


GO

