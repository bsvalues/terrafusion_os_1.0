





create  procedure GetAgents

@input_prop_id		int,
@input_owner_id	int,
@input_yr		numeric(4),
@input_entity_agent	varchar(70) output,
@input_cad_agent	varchar(70) output,
@input_arb_agent	varchar(70) output

as

declare @agent_name	varchar(200)
declare @ent_mailings	char(1)
declare @ca_mailings char(1)
declare @arb_mailings char(1)

DECLARE AGENTS CURSOR FAST_FORWARD
FOR select a.file_as_name, aa.ent_mailings, aa.ca_mailings, aa.arb_mailings
from agent_assoc aa, account a
where aa.prop_id = convert(varchar(15), @input_prop_id)
	and aa.owner_id = convert(varchar(15), @input_owner_id)
	and aa.owner_tax_yr = convert(varchar(4), @input_yr)
	and aa.agent_id = a.acct_id

OPEN AGENTS
FETCH NEXT FROM AGENTS into @agent_name, @ent_mailings, @ca_mailings, @arb_mailings

if (@@FETCH_STATUS = 0)
begin
	if (@ent_mailings = 'T')
	begin
		set @input_entity_agent = @agent_name
	end

	if (@ca_mailings = 'T')
	begin
		set @input_cad_agent = @agent_name
	end

	if (@arb_mailings = 'T')
	begin
		set @input_arb_agent = @agent_name
	end
end

CLOSE AGENTS
DEALLOCATE AGENTS

GO

