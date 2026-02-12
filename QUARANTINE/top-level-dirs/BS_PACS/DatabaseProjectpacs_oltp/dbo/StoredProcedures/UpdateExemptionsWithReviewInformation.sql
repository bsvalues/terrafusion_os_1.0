
create procedure UpdateExemptionsWithReviewInformation

	@run_id int,
	@request_date varchar(10),
	@status varchar(10),
	@exemption_comment varchar(4000)

as 

declare @completed bit

if len(@status) = 0
begin
	set @status = null
	set @completed = 0
end
else
begin
	select @completed = completed
	from exemption_renewal_status as ers
	with (nolock)
	where code = @status
end

update property_exemption
set review_request_date = case when len(@request_date) > 0
															then convert(datetime, @request_date)
															else null end,
		review_status_cd = @status,
		sp_comment = case when len(@exemption_comment) > 0 
											then left(@exemption_comment + ' ' + sp_comment, 5000)
											else sp_comment end,
		review_last_year = case when len(@request_date) > 0 and year(convert(datetime, @request_date)) = err.[year] and @completed = 1
														then err.[year]
														else null end
from property_exemption as pe
join exemption_review_run_prop_assoc as errpa
with (nolock)
on pe.prop_id = errpa.prop_id
and errpa.run_id = @run_id
join exemption_review_run as err
with (nolock)
on errpa.run_id = err.run_id
and pe.exmpt_tax_yr = err.[year]
and pe.owner_tax_yr = err.[year]
where pe.sup_num = 0
and pe.exmpt_type_cd = 'SNR/DSBL'

GO

