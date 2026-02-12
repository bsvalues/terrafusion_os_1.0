
create function dbo.fn_GetApprNoticeEntities ( @input_notice_yr numeric(4,0), @input_notice_num int, @input_prop_id int, @input_sup_num int, @input_sup_yr numeric(4,0), @input_owner_id int )
returns varchar(100)
as
begin
	declare @output_entities varchar(100)
	set @output_entities = space(0)

	declare @entity_code varchar(5)

	declare ENTITIES cursor
	for
	select distinct
		ltrim(rtrim(e.entity_cd))
	from
		appr_notice_prop_list_bill as anplb with (nolock)
	inner join
		entity as e with (nolock)
	on
		e.entity_id = anplb.entity_id
	where
		anplb.notice_yr = @input_notice_yr
	and	anplb.notice_num = @input_notice_num
	and	anplb.prop_id = @input_prop_id
	and	anplb.sup_num = @input_sup_num
	and	anplb.sup_yr = @input_sup_yr
	and	anplb.owner_id = @input_owner_id

	open ENTITIES
	fetch next from ENTITIES
	into
		@entity_code
	
	while (@@fetch_status = 0)
	begin
		if (@output_entities <> space(0))
		begin
			set @output_entities = @output_entities + ', '
		end

		set @output_entities = @output_entities + @entity_code

		fetch next from ENTITIES
		into
			@entity_code
	end

	close ENTITIES
	deallocate ENTITIES

	return @output_entities
end

GO

