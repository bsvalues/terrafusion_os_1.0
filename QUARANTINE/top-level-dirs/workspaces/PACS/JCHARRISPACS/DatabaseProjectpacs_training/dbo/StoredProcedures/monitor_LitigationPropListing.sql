
Create procedure [dbo].[monitor_LitigationPropListing]

/*********
This monitor produces a listing of properties under a specified litigation_id

*************/
@litigation_id numeric(10,0)

AS
SET NOCOUNT ON

select distinct lpa.prop_id, p.geo_id, ac.acct_id, ac.file_as_name, addr.addr_line1, addr.addr_line2, addr.addr_line3, addr.addr_city, addr.addr_zip,
isnull(ph.phone_num,'') as phone_number----302
from litigation l with (nolock)

join litigation_prop_assoc lpa with (nolock)
on l.litigation_id = lpa.litigation_id

inner join property p with (nolock)
on lpa.prop_id = p.prop_id

inner join account ac with (nolock)
on p.col_owner_id = ac.acct_id

inner join address addr with (nolock)
on ac.acct_id = addr.acct_id
and addr.primary_addr = 'Y'

left outer join phone ph with (nolock)
on ac.acct_id = ph.acct_id

where l.litigation_id = @litigation_id
order by lpa.prop_id

GO

