
create view arb_docket_schedule_vw
with schemabinding
as

select
	a.prop_id, a.prop_val_yr, a.case_id, a.docket_id, aphd.docket_start_date_time
from dbo._arb_protest as a
join dbo._arb_protest_hearing_docket as aphd on
	a.docket_id = aphd.docket_id
where a.prot_arrived_dt is null

GO

CREATE NONCLUSTERED INDEX [idx_docket_start_date_time]
    ON [dbo].[arb_docket_schedule_vw]([docket_start_date_time] ASC) WITH (FILLFACTOR = 90);


GO

CREATE UNIQUE CLUSTERED INDEX [idx_arb_docket_schedule_vw]
    ON [dbo].[arb_docket_schedule_vw]([prop_id] ASC, [prop_val_yr] ASC, [case_id] ASC) WITH (FILLFACTOR = 90);


GO

