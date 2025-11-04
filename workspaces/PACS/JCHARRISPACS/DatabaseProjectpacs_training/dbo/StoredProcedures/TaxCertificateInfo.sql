
CREATE PROCEDURE TaxCertificateInfo

@input_tax_cert_num		int

AS


-- pacs_system year

declare @year		int

select @year	= tax_yr
from pacs_system


-- fee_tax_cert_assoc

declare @prop_id	int
declare @fee_id		int
declare @ref_num	varchar(30)
declare @effective_dt	datetime
declare @tax_cert_num	int
declare @comment	varchar(2048)
declare @paid_by_dt	datetime


select @prop_id 	= prop_id,
	@fee_id	= fee_id,
	@ref_num 	= ref_num,
	@effective_dt 	= effective_dt,
	@tax_cert_num	= tax_cert_num,
	@comment	= comment,
	@paid_by_dt 	= case when month(effective_dt) = 12
				then dateadd(dd, -1, '1/1/' + cast((year(effective_dt) + 1) as varchar(4)))
				else dateadd(dd, -1, cast(month(effective_dt)+1 as varchar(2)) + '/1/' + cast(year(effective_dt) as varchar(4))) end
from fee_tax_cert_assoc
where tax_cert_num = @input_tax_cert_num


-- fee

declare @date_of_issue	datetime
declare @requestor_id	int
declare @fee_amt	numeric(14,2)


select @date_of_issue	= fee_dt,
	@requestor_id	= fee_acct_assoc.acct_id,
	@fee_amt	= amt_due
from fee
left outer join fee_acct_assoc on
	fee.fee_id = fee_acct_assoc.fee_id
where fee.fee_id = @fee_id


declare @requestor	varchar(70)

select @requestor	= file_as_name
from account
where acct_id = @requestor_id



-- prop_supp_assoc

declare @sup_num	int
declare @owner_tax_yr	int

select top 1 @sup_num		= sup_num,
		@owner_tax_yr	= owner_tax_yr
from prop_supp_assoc
where prop_id = @prop_id
and owner_tax_yr <= @year
order by owner_tax_yr desc



-- property_val

declare @improvement_hs	numeric(14)
declare @improvement_nhs	numeric(14)
declare @land_hs		numeric(14)
declare @land_nhs		numeric(14)
declare @productivity_market	numeric(14)
declare @productivity_use	numeric(14)
declare @assessed_value	numeric(14)
declare @legal_description	varchar(255)
declare @legal_acres		numeric(14,4)

select @improvement_hs		= imprv_hstd_val,
	@improvement_nhs	= imprv_non_hstd_val,
	@land_hs		= land_hstd_val,
	@land_nhs		= land_non_hstd_val,
	@productivity_market	= isnull(ag_market,0) + isnull(timber_market,0),
	@productivity_use	= isnull(ag_use_val,0) + isnull(timber_use,0),
	@assessed_value	= assessed_val,
	@legal_description	= legal_desc,
	@legal_acres		= legal_acreage
from property_val
where 	prop_id = @prop_id
and	sup_num = @sup_num
and	prop_val_yr = @owner_tax_yr


-- Property

declare @geo_id		varchar(50)
declare @dba_name   varchar(50)

select
	@geo_id = geo_id,
	@dba_name = dba_name
from property with(nolock)
where prop_id = @prop_id


-- Situs

declare @situs_address varchar(256)

select
	@situs_address = REPLACE(isnull(situs.situs_display, ''), CHAR(13) + CHAR(10), ' ')
from situs with(nolock)
where
	prop_id = @prop_id and
	primary_situs = 'Y'


-- System Address

declare @sys_addr_line1		varchar(50)
declare @sys_addr_line2		varchar(50)
declare @sys_addr_line3		varchar(50)
declare @sys_addr_city		varchar(50)
declare @sys_addr_state	varchar(2)
declare @sys_addr_zip		varchar(10)

select @sys_addr_line1		= addr_line1,
	@sys_addr_line2	= addr_line2,
	@sys_addr_line3	= addr_line3,
	@sys_addr_city		= city,
	@sys_addr_state	= state,
	@sys_addr_zip		= zip
from system_address
where system_type = 'C'



select 1				as DumbID,
	@prop_id		as prop_id,
	@year			as year,
	@owner_tax_yr		as owner_tax_yr,
	@sup_num		as sup_num,
	@fee_id		as fee_id,
	@ref_num		as ref_num,
	@effective_dt		as effective_dt,
	@paid_by_dt		as paid_by_dt,
	@tax_cert_num		as tax_cert_num,
	@comment		as comment,
	@date_of_issue		as date_of_issue,
	@fee_amt		as fee_amt,
	@requestor		as requested_by,
	@improvement_hs	as improvement_hs,
	@improvement_nhs	as improvement_nhs,
	@land_hs		as land_hs,
	@land_nhs		as land_nhs,
	@productivity_market	as productivity_market,
	@productivity_use	as productivity_use,
	@assessed_value	as assessed_value,
	@legal_description	as legal_description,
	@legal_acres		as legal_acres,
	@geo_id		as geo_id,
	@sys_addr_line1	as sys_addr_line1,
	@sys_addr_line2	as sys_addr_line2,
	@sys_addr_line3	as sys_addr_line3,
	@sys_addr_city		as sys_addr_city,
	@sys_addr_state	as sys_addr_state,
	@sys_addr_zip		as sys_addr_zip,
	@situs_address		as situs_address,
	@dba_name			as dba_name

GO

