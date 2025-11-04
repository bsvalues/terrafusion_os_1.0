
CREATE PROCEDURE ResetLimitationOnAbsenceFromHomesteadExemptions

	@lYear int,
	@strExemption varchar(5),
	@dtAbsentFromExpire datetime,
	@dtAbsentToExpire datetime,
	@strPacsUserName varchar(30),
	@lPacsUserId int

as

set nocount on


	declare @prop_id int
	declare @owner_id int
	declare @exmpt_tax_yr int
	declare @owner_tax_yr int
	declare @prop_type_cd varchar(5)
	declare @exmpt_type_cd varchar(5)
	declare @sup_num int
	declare @absent_expiration_date datetime
	declare @event_id int
	declare @event_desc varchar(2048)


	declare curAbsentExemptions CURSOR FAST_FORWARD
	for SELECT pe.prop_id, pe.owner_id, pe.exmpt_tax_yr, pe.owner_tax_yr,
				pe.prop_type_cd, pe.exmpt_type_cd, sup_num, absent_expiration_date
		FROM property_exemption as pe
		WITH (NOLOCK)

		WHERE pe.exmpt_tax_yr = @lYear
		AND pe.owner_tax_yr = @lYear
		AND pe.exmpt_type_cd = @strExemption
		AND pe.absent_expiration_date >= @dtAbsentFromExpire
		AND pe.absent_expiration_date <= @dtAbsentToExpire
		AND pe.sup_num = 0
		ORDER BY pe.absent_expiration_date, pe.prop_id

	open curAbsentExemptions

	fetch next from curAbsentExemptions into @prop_id, @owner_id, @exmpt_tax_yr,
				@owner_tax_yr, @prop_type_cd, @exmpt_type_cd, @sup_num, @absent_expiration_date

	while @@fetch_status = 0
	begin
		delete from property_exemption
		where prop_id = @prop_id
		and owner_id = @owner_id
		and exmpt_tax_yr = @exmpt_tax_yr
		and owner_tax_yr = @owner_tax_yr
		and prop_type_cd = @prop_type_cd
		and exmpt_type_cd = @exmpt_type_cd
		and sup_num = @sup_num

		exec dbo.GetUniqueID 'event', @event_id output, 1, 0
		
		insert into event
		(event_id, system_type, event_type, event_date, pacs_user, event_desc, pacs_user_id)
		values
		(@event_id, 'A', 'SYSTEM', getdate(), @strPacsUserName,
			'The ' + @strExemption + ' exemption was removed because the exemption had expired on ' + convert(varchar(10), @absent_expiration_date, 101), @lPacsUserId)

		insert into prop_event_assoc
		(prop_id, event_id)
		values
		(@prop_id, @event_id)

		fetch next from curAbsentExemptions into @prop_id, @owner_id, @exmpt_tax_yr,
				@owner_tax_yr, @prop_type_cd, @exmpt_type_cd, @sup_num, @absent_expiration_date
	end

	close curAbsentExemptions
	deallocate curAbsentExemptions


/*
 * Log system event showing the process ran
 */

set @event_desc = 'Reset Limitation on Absence from Homestead from '
set @event_desc = @event_desc + convert(varchar(10), @dtAbsentFromExpire, 101) + ' to '
set @event_desc = @event_desc + convert(varchar(10), @dtAbsentToExpire, 101)

exec dbo.InsertSystemEvent 'RLAH', @event_desc, @lPacsUserId

GO

