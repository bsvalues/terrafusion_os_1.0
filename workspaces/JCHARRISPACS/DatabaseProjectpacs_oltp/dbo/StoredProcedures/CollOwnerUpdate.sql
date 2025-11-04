


CREATE   procedure CollOwnerUpdate

@update_owners		bit,
@update_agents		bit


as

set nocount on

if @update_owners = 1 and @update_agents = 1 
begin


	update property 
	set
		property.col_owner_id = o.owner_id,
		property.col_agent_id = aa.agent_id,
		property.col_owner_yr = maxyr.owner_tax_yr
		
	from property with(nolock)

	join
	(
		select owner.prop_id, max(owner.owner_tax_yr) as owner_tax_yr 
		from owner with(nolock)
		group by owner.prop_id
	) as maxyr on
		property.prop_id = maxyr.prop_id

	join prop_supp_assoc as psa with(nolock) on
		psa.prop_id = property.prop_id
		and psa.owner_tax_yr = maxyr.owner_tax_yr

	join owner as o with(nolock) on
		o.prop_id = property.prop_id and
		o.owner_tax_yr = maxyr.owner_tax_yr and
		o.sup_num = psa.sup_num

	join pacs_system as ps with(nolock) on
		0 = 0

	left outer join 
	(
		select aa.prop_id, max(aa.owner_tax_yr) as owner_tax_yr 
		from agent_assoc as aa with(nolock) 
		group by aa.prop_id
	) as maxyra on
		maxyra.prop_id = property.prop_id
	left outer join agent_assoc as aa with(nolock) on
			aa.prop_id=property.prop_id
	and aa.owner_tax_yr=maxyra.owner_tax_yr

	where
		col_owner_override=0 and (
		isnull(property.col_owner_id,0) <> o.owner_id or
		isnull(property.col_agent_id,0) <> aa.agent_id
		)
end

if @update_owners = 1 and @update_agents = 0 
begin

	update property 
	set
		property.col_owner_id = o.owner_id,
		property.col_owner_yr = maxyr.owner_tax_yr
		
	from property with(nolock)

	join
	(
		select owner.prop_id, max(owner.owner_tax_yr) as owner_tax_yr 
		from owner with(nolock)
		group by owner.prop_id
	) as maxyr on
		property.prop_id = maxyr.prop_id

	join prop_supp_assoc as psa with(nolock) on
		psa.prop_id = property.prop_id
		and psa.owner_tax_yr = maxyr.owner_tax_yr

	join owner as o with(nolock) on
		o.prop_id = property.prop_id and
		o.owner_tax_yr = maxyr.owner_tax_yr and
		o.sup_num = psa.sup_num

	join pacs_system as ps with(nolock) on
		0 = 0

	where
		col_owner_override=0 and 
		isnull(property.col_owner_id,0) <> o.owner_id 

end

if @update_owners = 0 and @update_agents = 1 
begin

	update property 
	set
		property.col_agent_id = aa.agent_id
	from property with(nolock)


	join pacs_system as ps with(nolock) on
		0 = 0

	inner join 
	(
		select aa.prop_id, max(aa.owner_tax_yr) as owner_tax_yr 
		from agent_assoc as aa with(nolock) 
		group by aa.prop_id
	) as maxyra on
		maxyra.prop_id = property.prop_id
	inner join agent_assoc as aa with(nolock) on
			aa.prop_id=property.prop_id 
	and aa.owner_tax_yr=maxyra.owner_tax_yr

	where	isnull(property.col_agent_id,0) <> aa.agent_id
end

GO

