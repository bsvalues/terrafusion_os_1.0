CREATE TABLE [dbo].[mineral_import] (
    [run_id]          INT         NOT NULL,
    [year]            NUMERIC (4) NOT NULL,
    [appr_company_id] INT         NOT NULL,
    CONSTRAINT [CPK_mineral_import] PRIMARY KEY CLUSTERED ([run_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_mineral_import_appr_company_id] FOREIGN KEY ([appr_company_id]) REFERENCES [dbo].[appr_company] ([appr_company_id])
);


GO



create trigger tr_mineral_import_delete
	on	mineral_import
	for	delete
	not for replication

as


if ( @@rowcount = 0 )
begin
     return
end
 
set nocount on

declare @run_id int

declare curRows cursor
for
	select
		run_id
	from
		deleted
for read only

open curRows

fetch next from curRows
into
	@run_id

while (@@fetch_status = 0)
begin
	delete
		mineral_import_status
	where
		run_id = @run_id

	delete
		mineral_import_entity
	where
		run_id = @run_id

	delete
		mineral_import_exemption
	where
		run_id = @run_id

	delete
		mineral_import_owner
	where
		run_id = @run_id

	delete
		mineral_import_agent
	where
		run_id = @run_id

	delete
		mineral_import_property
	where
		run_id = @run_id

	delete
		mineral_import_special_entity_exemption
	where
		run_id = @run_id
	
	delete
		mineral_import_capitol
	where
		run_id = @run_id

	delete
		mineral_import_agent_capitol
	where
		run_id = @run_id

	delete
		mineral_import_typickett
	where
		run_id = @run_id

	delete
		mineral_import_typickett_L1
	where
		run_id = @run_id

	delete
		mineral_import_typickett_L2
	where
		run_id = @run_id

	delete
		mineral_import_typickett_S1
	where
		run_id = @run_id

	delete
		mineral_import_typickett_R1
	where
		run_id = @run_id

	delete
		mineral_import_typickett_O1
	where
		run_id = @run_id

	delete
		mineral_import_utility_typickett
	where
		run_id = @run_id

	delete
		mineral_import_utility_typickett_N
	where
		run_id = @run_id

	delete
		mineral_import_utility_typickett_O1
	where
		run_id = @run_id

	delete
		mineral_import_agent_typickett
	where
		run_id = @run_id

	delete
		mineral_import_data_pritchard_abbott
	where
		run_id = @run_id

	delete
		mineral_import_pritchard_abbott
	where
		run_id = @run_id

	delete
		mineral_import_agent_data_pritchard_abbott
	where
		run_id = @run_id

	delete
		mineral_import_agent_pritchard_abbott
	where
		run_id = @run_id

	delete
		mineral_import_wardlaw
	where
		run_id = @run_id

	delete
		mineral_import_agent_wardlaw
	where
		run_id = @run_id

	fetch next from curRows
	into
		@run_id
end

close curRows
deallocate curRows

set nocount off

GO

