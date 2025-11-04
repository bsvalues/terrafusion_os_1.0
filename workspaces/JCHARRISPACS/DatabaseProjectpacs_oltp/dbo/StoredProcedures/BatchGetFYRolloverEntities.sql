


create procedure BatchGetFYRolloverEntities

as

set nocount on

	create table #tmp_entities
	(
		entity_id int not null,
		fiscal_year varchar(20) not null
	)

	insert #tmp_entities (
		entity_id, fiscal_year
	)
	select distinct entity_id, max(fiscal_year)
	from recap_fiscal with(nolock)
	group by entity_id

set nocount off

	select
		e.entity_cd, r.begin_date, r.end_date, t.entity_id
	from #tmp_entities as t
	join recap_fiscal as r with(nolock) on
		t.entity_id = r.entity_id and
		t.fiscal_year = r.fiscal_year
	join entity as e with(nolock) on
		t.entity_id = e.entity_id

GO

