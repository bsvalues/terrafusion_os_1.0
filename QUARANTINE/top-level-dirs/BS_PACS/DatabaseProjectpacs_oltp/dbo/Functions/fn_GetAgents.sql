


CREATE FUNCTION fn_GetAgents ( @input_prop_id int, @input_year int, @input_sup_num int, @input_owner_id int )
RETURNS varchar(2048)
AS
BEGIN
	declare @output_agents  varchar(2048)
	declare @agent_id	int

	set @output_agents = ''

	DECLARE AGENT CURSOR FAST_FORWARD
	FOR select aa.agent_id
		from prop_supp_assoc psa with (nolock)
		inner join agent_assoc aa with (nolock) on
			aa.prop_id = psa.prop_id 
		and 	aa.owner_id = @input_owner_id
		and	aa.owner_tax_yr = psa.owner_tax_yr 
		and	aa.auth_to_protest = 'T'
		inner join agent a with (nolock) on
			a.agent_id = aa.agent_id 
		and	a.inactive_flag = 0
		where 
		psa.prop_id in 
			(select prop_id 
			from 
				property_val pv with (nolock)
			where   (pv.prop_id = @input_prop_id or pv.udi_parent_prop_id = @input_prop_id)
			and 	pv.prop_val_yr = @input_year
			and 	pv.sup_num = @input_sup_num
			and	(pv.prop_inactive_dt is null or pv.udi_parent = 'T'))
									
		and	psa.owner_tax_yr = @input_year 
		and 	psa.sup_num = @input_sup_num

	OPEN AGENT

	FETCH NEXT FROM AGENT into @agent_id
	
	while (@@FETCH_STATUS = 0)
	begin
		if (@output_agents = '')
		begin 
			select @output_agents = rtrim(cast(@agent_id as varchar(14)))
		end
		else 
		begin
			select @output_agents = @output_agents + ', ' + rtrim(cast(@agent_id as varchar(14)))
		end
  
		FETCH NEXT FROM AGENT into @agent_id
	end

	CLOSE AGENT
	DEALLOCATE AGENT

	RETURN (@output_agents)
END

GO

