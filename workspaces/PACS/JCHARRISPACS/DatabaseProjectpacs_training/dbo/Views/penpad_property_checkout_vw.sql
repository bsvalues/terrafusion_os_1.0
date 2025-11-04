
create view penpad_property_checkout_vw
with schemabinding

as

	select pc.prop_id, lNotUsed = count_big(*)
	from dbo.penpad_checkout as pc
	join dbo.penpad_run as pr on
		pc.run_id = pr.run_id
	where pr.check_in_date is null
	group by pc.prop_id

GO

CREATE UNIQUE CLUSTERED INDEX [idx_penpad_property_checkout_vw]
    ON [dbo].[penpad_property_checkout_vw]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

