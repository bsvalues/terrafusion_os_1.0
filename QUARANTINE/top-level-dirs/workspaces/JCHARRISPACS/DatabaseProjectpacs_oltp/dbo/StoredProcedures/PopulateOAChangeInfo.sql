
CREATE PROCEDURE PopulateOAChangeInfo

@start_date as varchar(10),
@end_date as varchar(10),
@export_type as varchar(1),
@exclude_confidential_flag as varchar(1) = ''

AS


set nocount on

declare @year	numeric(4)

select @year = pacs_system.appr_yr
from pacs_system

delete from oa_changes 
delete from oa_change_info


/* populate all owner changes */
if (@export_type = 'B' or @export_type = 'O')
begin

	insert into oa_changes
	select distinct
	       acct_id,
	       'O',
	       'U',
	       pv.prop_id,
	       pv.prop_val_yr,
	       pv.sup_num,
	       case when owner_update_dt >= @start_date + ' 00:00' and owner_update_dt <= @end_date + ' 23:59' then owner_update_dt else null end,
	       case when  update_dt >= @start_date + ' 00:00' and update_dt <= @end_date + ' 23:59' then update_dt else null end
	      
	
	from property_val pv with (nolock),
	     owner o with (nolock),
	     account a with (nolock)
	where pv.prop_id = o.prop_id
	and   pv.sup_num = o.sup_num
	and   pv.prop_val_yr = o.owner_tax_yr
	and   o.owner_id     = a.acct_id
	and   ((pv.owner_update_dt >= @start_date + ' 00:00 '
	and     pv.owner_update_dt <  @end_date + ' 23:59 '
	and     pv.owner_update_dt is  not null)
	or     (a.update_dt >= @start_date + ' 00:00 '
	and     a.update_dt <  @end_date + ' 23:59 '
	and     a.update_dt is not null))
	and    o.owner_tax_yr = @year
end

if (@export_type = 'B' or @export_type = 'A')
begin

	/* populate agent changes */
	insert into oa_changes
	select distinct
	       acct_id,
	       'A',
	       case when acct_id is not null then 'U' else 'D' end,
	       pv.prop_id,
	       pv.prop_val_yr,
	       pv.sup_num,
	       case when agent_update_dt >= @start_date + ' 00:00' and agent_update_dt <= @end_date + ' 23:59' then agent_update_dt else null end,
	       case when  a.update_dt >= @start_date + ' 00:00' and a.update_dt <= @end_date + ' 23:59' then a.update_dt else null end
	      
	
	from property_val pv with (nolock)
	left outer join agent_assoc aa with (nolock)
	on   pv.prop_id = aa.prop_id
	and  pv.prop_val_yr = aa.owner_tax_yr
	left outer join account a on
	aa.agent_id = a.acct_id
	
	where pv.prop_val_yr = @year
	and   ((pv.agent_update_dt >= @start_date + ' 00:00 '
		and pv.agent_update_dt <  @end_date + ' 23:59 '
		and pv.agent_update_dt is  not null)
	or    (a.update_dt >= @start_date + ' 00:00 '
	  and   a.update_dt < @end_date + ' 23:59 '
	  and   a.update_dt is not null))

	
end

insert into oa_change_info (
	record_type, prop_id, prop_val_yr, current_account_id, current_percentage, current_name, current_addr1, current_addr2, current_addr3, current_city, current_state, current_zip, current_deliverable_flag, current_country, current_confidential_flag, prop_type_desc, geo_id, legal_description, legal_acreage, abs_subdv_cd, block, tract_or_lot, entities, change_reason, ownership_chg_dt, address_chg_dt, deed_book_id, deed_book_page, deed_type, deed_num, deed_dt, deed_recorded_dt, dba_name, chg_dt
)
SELECT distinct oc.acct_type,
	oc.prop_id,
	oc.owner_tax_yr,
	IsNull(a.acct_id, 0),
	case when oc.acct_type = 'O' then ISNULL(o.pct_ownership, 0) else 0 end,
	a.file_as_name,
	ad.addr_line1,
	ad.addr_line2,
	ad.addr_line3,
	ad.addr_city,
	ad.addr_state,
	ad.addr_zip,
	ad.ml_deliverable,
	ISNULL(c.country_name, ''),
	ISNULL(a.confidential_flag, 'N'),
	ISNULL(pt.prop_type_desc, ''),
	p.geo_id,
	pv.legal_desc,
	pv.legal_acreage,
	pv.abs_subdv_cd,
	pv.block,
	pv.tract_or_lot,
	'', -- entities done later
	case when acct_type = 'O'  and oc.update_dt is not null and (oc.update_dt > oc.address_update_dt or oc.address_update_dt is null) then 'Property Owner Change' 
	     when  acct_type = 'A' and oc.update_dt is not null and (oc.update_dt > oc.address_update_dt or oc.address_update_dt is null) then 'Agent Change' 
	     else cr.chg_reason_desc
	     end,
	oc.update_dt,
	oc.address_update_dt, -- not an address change
	'',
	'',
	'',
	0,
	NULL,
	NULL,
	p.dba_name,
	case
		when ((oc.update_dt is not null and oc.address_update_dt is not null)
			and (oc.update_dt > oc.address_update_dt))
		then
			oc.update_dt
		when ((oc.update_dt is not null and oc.address_update_dt is not null)
			and (oc.address_update_dt > oc.update_dt))
		then
			oc.address_update_dt
		when (oc.update_dt is not null and oc.address_update_dt is not null)
		then
			oc.update_dt
		when oc.address_update_dt is null
		then oc.update_dt
		else oc.address_update_dt
		end
FROM oa_changes as oc
WITH (NOLOCK)

INNER JOIN property as p
WITH (NOLOCK)
ON oc.prop_id = p.prop_id

INNER JOIN property_type as pt
WITH (NOLOCK)
ON p.prop_type_cd = pt.prop_type_cd

INNER JOIN property_val as pv
WITH (NOLOCK)
ON oc.prop_id = pv.prop_id
AND oc.owner_tax_yr = pv.prop_val_yr
AND oc.sup_num = pv.sup_num


/*
 * Show all owners.  So if owner was deleted, cannot INNER JOIN
 * on that particular one.  Also cannot join on acct_id =
 * owner_id because it may not exist any more AND we want ALL
 * owners.
 */

LEFT OUTER JOIN owner as o
WITH (NOLOCK)
ON oc.prop_id = o.prop_id
AND oc.owner_tax_yr = o.owner_tax_yr
AND oc.sup_num = o.sup_num

LEFT OUTER JOIN agent_assoc as aa
WITH (NOLOCK)
ON oc.prop_id = aa.prop_id
AND oc.owner_tax_yr = aa.owner_tax_yr

LEFT OUTER JOIN account as a
WITH (NOLOCK)
ON oc.acct_id = a.acct_id
/*
ON o.owner_id = a.acct_id 
OR aa.agent_id = a.acct_id
*/

LEFT OUTER JOIN address as ad
WITH (NOLOCK)
ON a.acct_id = ad.acct_id
AND ad.primary_addr = 'Y'

LEFT OUTER JOIN chg_reason as cr
WITH (NOLOCK)
ON ad.chg_reason_cd = cr.chg_reason_cd

LEFT OUTER JOIN country as c
WITH (NOLOCK)
ON ad.country_cd = c.country_cd

WHERE  oc.prop_id IN (SELECT prop_id
			FROM entity_prop_assoc
			WITH (NOLOCK)
			INNER JOIN oa_change_entity
			ON entity_prop_assoc.entity_id = oa_change_entity.entity_id
			AND entity_prop_assoc.tax_yr = @year)
AND CASE WHEN @export_type = 'A' AND oc.acct_type = 'A'
	THEN 1
	WHEN @export_type = 'O' AND oc.acct_type = 'O'
	THEN 1
	WHEN @export_type = 'B'
	THEN 1
	ELSE 0
	END = 1
AND (oc.owner_tax_yr = @year or oc.owner_tax_yr = 0)
AND CASE WHEN @exclude_confidential_flag = 'Y' AND IsNull(a.confidential_flag, 'F') = 'T'
	THEN 0
	WHEN @exclude_confidential_flag = 'Y' AND ISNULL(a.confidential_flag, 'F') = 'F'
	THEN 1
	ELSE 1
	END = 1 


declare @prop_id as int
declare @entity_cd as varchar(5)
declare @entities  as varchar(40)

DECLARE PROP_IDS CURSOR FAST_FORWARD
FOR	SELECT DISTINCT prop_id
	FROM oa_change_info

OPEN PROP_IDS

FETCH NEXT FROM PROP_IDS INTO @prop_id

WHILE @@FETCH_STATUS = 0
BEGIN
	set @entities = ''

	exec GetEntities '', @prop_id, 0, @year, @entities output

	/*
	 * Do deed info here
	 */

	declare @deed_book_id as varchar(20)
	declare @deed_book_page as varchar(20)
	declare @deed_type as varchar(50)
	declare @deed_num as varchar(50)
	declare @deed_dt as datetime
	declare @deed_recorded_dt as datetime

	set @deed_book_id     = null
	set @deed_book_page   = null
	set @deed_type 	      = null
	set @deed_num	      = null
	set @deed_dt	      = null
	set @deed_recorded_dt = null

	SELECT TOP 1 @deed_book_id     = coo.deed_book_id,
		     @deed_book_page   = coo.deed_book_page,
		     @deed_type        = deed_type.deed_type_desc,
		     @deed_num         = coo.deed_num,
		     @deed_dt          = coo.deed_dt,
		     @deed_recorded_dt = coo.recorded_dt
	FROM chg_of_owner_prop_assoc as coopa
	WITH (NOLOCK)
	INNER JOIN chg_of_owner as coo
	WITH (NOLOCK)
	ON coopa.chg_of_owner_id = coo.chg_of_owner_id
	INNER JOIN deed_type
	WITH (NOLOCK)
	ON coo.deed_type_cd = deed_type.deed_type_cd
	WHERE coopa.prop_id = @prop_id
	ORDER BY coo.deed_dt DESC

	UPDATE oa_change_info
	SET entities = @entities,
		deed_book_id = ISNULL(@deed_book_id, ''),
		deed_book_page = ISNULL(@deed_book_page, ''),
		deed_type = ISNULL(@deed_type, ''),
		deed_num = ISNULL(@deed_num, '0'),
		deed_dt = @deed_dt,
		deed_recorded_dt = @deed_recorded_dt
	WHERE prop_id = @prop_id

	FETCH NEXT FROM PROP_IDS INTO @prop_id
END

CLOSE PROP_IDS
DEALLOCATE PROP_IDS

GO

