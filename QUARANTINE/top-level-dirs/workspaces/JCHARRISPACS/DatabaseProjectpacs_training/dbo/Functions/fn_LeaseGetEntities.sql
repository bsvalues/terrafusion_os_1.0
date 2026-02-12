
create function fn_LeaseGetEntities (@input_lease_id varchar(20), @input_lease_yr int, @input_rev_num int)
returns varchar(255)
 
as


begin

if (@input_rev_num is null)
begin
	select
		@input_rev_num = max(l.rev_num)
	from
		lease as l with (nolock)
	where
		l.lease_id = @input_lease_id
	and	l.lease_yr = @input_lease_yr
end


declare leaseEntities cursor fast_forward
for
select
	rtrim(e.entity_cd) as entity_cd,
	lea.entity_pct
from
	lease_entity_assoc AS lea with (nolock)
inner join
	entity as e with (nolock)
on
	lea.entity_id = e.entity_id
where
	lease_id = @input_lease_id
and	lease_yr = @input_lease_yr
and	rev_num = @input_rev_num
order by
	entity_cd


declare @entities varchar(255)
set @entities = ''

declare @entity_cd varchar(5)
declare @entity_pct numeric(13,10)

open leaseEntities

fetch next from
	leaseEntities
into
	@entity_cd,
	@entity_pct

while @@fetch_status = 0
begin
	if @entities <> ''
	begin
		set @entities = @entities + ', '
	end

	set @entities = @entities + @entity_cd

	if @entity_pct <> 100.0
	begin
		set @entities = @entities + '(' + convert(varchar(20), @entity_pct) + ')'
	end

	fetch next from
		leaseEntities
	into
		@entity_cd,
		@entity_pct
end


close leaseEntities
deallocate leaseEntities



return (isnull(@entities, ''))


end

GO

