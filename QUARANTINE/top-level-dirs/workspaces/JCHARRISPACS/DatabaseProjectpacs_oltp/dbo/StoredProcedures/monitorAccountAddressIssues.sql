        
        
        
        
        
        
---here is how you set up the monitor call:  {Call monitorAccountAddressIssues }        
  -- [monitorAccountAddressIssues]            
              
CREATE PROCEDURE [dbo].[monitorAccountAddressIssues]              
              
    @id int = null 
	 as
SET NOCOUNT ON

SET ANSI_WARNINGS OFF

IF OBJECT_ID('tempdb..#addr_compare') IS NOT NULL
  /*Then it exists*/
  DROP TABLE #addr_compare

select pv.prop_id,pv.prop_val_yr,o.owner_id,isnull(ltrim(rtrim(line_1)),'') as line_1,isnull(ltrim(rtrim(line_2)),'') as line_2,isnull(ltrim(rtrim(line_3)),'') as line_3,isnull(ltrim(rtrim(city)),'') as city,isnull(ltrim(rtrim(zip_postal_code)),'') as zip_postal_code,
isnull(a.addr_line1,'') as addr_line1,isnull(a.addr_line2,'') as addr_line2,isnull(a.addr_line3,'') as addr_line3,isnull(addr_city,'') as addr_city,isnull(addr_zip,'') as addr_zip,
isnull(ltrim(rtrim(a.addr_line1)),'')+' '+isnull(ltrim(rtrim(a.addr_line2)),'')+' '+isnull(ltrim(rtrim(a.addr_line3)),'')+' '+isnull(ltrim(rtrim(addr_city)),'')+' '+isnull(ltrim(rtrim(addr_zip)),'') as pacsAddress,
src.addrHash,
pv.sub_type
into #addr_compare
from dbo.property_val  pv with(nolock)
join dbo.owner o with(nolock) on
pv.prop_id = o.prop_id
and pv.prop_val_yr = o.owner_tax_yr
join dbo.address a with(nolock) on
a.acct_id = o.owner_id
and a.primary_addr = 'y'

join (

select ppi.property_id,a.*,
isnull(ltrim(rtrim(line_1)),'')+' '+isnull(ltrim(rtrim(line_2)),'')+' '+isnull(ltrim(rtrim(line_3)),'')+' '+isnull(ltrim(rtrim(city)),'')+' '+isnull(ltrim(rtrim(zip_postal_code)),'') as addrHash
--into cnv_area_benton.dbo.CNV_OWNER_XREF
from cnv_src_benton_2_14_2017.dbo.PROPERTY p
join cnv_src_benton_2_14_2017.dbo.PARTY_PROP_INVLMNT ppi on ppi.property_id = p.id
join cnv_src_benton_2_14_2017.dbo.address a on
ppi.address_id = a.id
where 1=1
-- and  ppi.prop_role_cd <> 524	--owner role
and ppi.eff_to_date is null		--indicates current owner
and ppi.print_notice_ind = 'Y'  --indicates primary owner
--order by ppi.property_id
) src on
pv.prop_id = src.property_id
where pv.prop_val_yr = 2016
and pv.prop_inactive_dt is null
--and pv.sub_type is null
--and pv.prop_id in (52249,83218)


select (select file_as_name from account where acct_id = owner_id) as name,* 
from #addr_compare
where 1=1
and pacsAddress<>addrHash
--and prop_id in (52249,83218)
order by owner_id,prop_id

drop table    #addr_compare
        
set nocount off

GO

