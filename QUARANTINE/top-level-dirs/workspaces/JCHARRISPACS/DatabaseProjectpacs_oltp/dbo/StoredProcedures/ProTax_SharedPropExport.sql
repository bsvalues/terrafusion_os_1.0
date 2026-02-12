
CREATE procedure ProTax_SharedPropExport

	@lYear numeric(4,0),
	@szGroupCode varchar(20)

as

set nocount on

if @szGroupCode <> 'ALL'
begin
	select
		spt.pacs_prop_id,
		spt.shared_year,
		spt.shared_cad_code,
		spt.shared_prop_id
	from
		shared_prop as spt with(nolock)
	join	prop_group_assoc as pga with (nolock)
		on spt.pacs_prop_id = pga.prop_id
		and pga.prop_group_cd = @szGroupCode
	where
		spt.shared_year = @lYear
	order by
		spt.pacs_prop_id
end
else
begin
	select
		spt.pacs_prop_id,
		spt.shared_year,
		spt.shared_cad_code,
		spt.shared_prop_id
	from
		shared_prop as spt with(nolock)
	where
		spt.shared_year = @lYear
	order by
		spt.pacs_prop_id
end

GO

