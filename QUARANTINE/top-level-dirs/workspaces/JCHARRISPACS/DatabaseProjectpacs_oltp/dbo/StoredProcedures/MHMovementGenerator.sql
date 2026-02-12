
create procedure MHMovementGenerator
	@datasetID int,
	@movementTypes varchar(max) = null,
	@startDate datetime = null,
	@endDate datetime = null
as


declare @queryStr varchar(max)
set @queryStr = 
		'insert into ##mh_movement_report (dataset_id, mhm_id, prop_id, status_dt, mhm_type_cd, mhm_status_cd, completed) ' +
		'select ' + CONVERT(VARCHAR, @datasetID) + ', mhm_id, prop_id, status_dt, mhm_type_cd, mhm.mhm_status_cd, msc.completed ' +
		'from mh_movement mhm with(nolock) ' +
		'left join mhm_status_code msc with(nolock) on mhm.mhm_status_cd = msc.mhm_status_cd '

declare @whereStr varchar(max)
set @whereStr = ''

if @movementTypes is not null
begin
		set @whereStr = 'where mhm_type_cd in (' + @movementTypes + ') '
end

if @startDate is not null
begin
		if LEN(@whereStr) = 0
			set @whereStr = 'where '
		else
			set @whereStr = @whereStr + ' and '
			
		set @whereStr = @whereStr + 'status_dt >= ''' + convert(varchar, @startDate) + ''' '
end

if @endDate is not null
begin
		if LEN(@whereStr) = 0
			set @whereStr = 'where '
		else
			set @whereStr = @whereStr + ' and '

		set @whereStr = @whereStr + 'status_dt <= ''' + convert(varchar, @endDate) + ''' '
end

exec (@queryStr + @whereStr)

GO

