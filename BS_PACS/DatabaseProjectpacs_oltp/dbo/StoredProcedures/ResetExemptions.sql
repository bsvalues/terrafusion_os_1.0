
CREATE PROCEDURE ResetExemptions
@input_yr	numeric(4),
@reset_hs 	varchar(1) = 'F',
@reset_hsov65	varchar(1) = 'F',
@reset_hsdp	varchar(1) = 'F',
@reset_dv	varchar(1) = 'F',
@reset_ex	varchar(1) = 'F',
@reset_agtim	varchar(1) = 'F',
@reset_special	varchar(1) = 'F',
@option_hs	varchar(1) = 'F'

AS

--Here are the exemption variables; They will each hold an exemption code...
declare @exmpt_hs	varchar(5)
declare @exmpt_ov65	varchar(5)
declare @exmpt_ov65s	varchar(5)
declare @exmpt_dp	varchar(5)
declare @exmpt_dv1	varchar(5)
declare @exmpt_dv1s	varchar(5)
declare @exmpt_dv2	varchar(5)
declare @exmpt_dv2s	varchar(5)
declare @exmpt_dv3	varchar(5)
declare @exmpt_dv3s	varchar(5)
declare @exmpt_dv4	varchar(5)
declare @exmpt_dv4s	varchar(5)
declare @exmpt_ex	varchar(5)
declare @exmpt_ag	varchar(5)
declare @exmpt_special1	varchar(5)
declare @exmpt_special2	varchar(5)
declare @exmpt_special3	varchar(5)
declare @exmpt_special4	varchar(5)
declare @exmpt_special5	varchar(5)
declare @exmpt_special6	varchar(5)
declare @exmpt_special7	varchar(5)
declare @exmpt_special8	varchar(5)

set @exmpt_hs 		= 'HS'
set @exmpt_ov65 	= 'OV65'
set @exmpt_ov65s 	= 'OV65S'
set @exmpt_dp 		= 'DP'
set @exmpt_dv1		= 'DV1'
set @exmpt_dv1s		= 'DV1S'
set @exmpt_dv2		= 'DV2'
set @exmpt_dv2s		= 'DV2S'
set @exmpt_dv3		= 'DV3'
set @exmpt_dv3s		= 'DV3S'
set @exmpt_dv4		= 'DV4'
set @exmpt_dv4s		= 'DV4S'
set @exmpt_ex		= 'EX'
set @exmpt_ag		= 'AG'
set @exmpt_special1	= 'AB'
set @exmpt_special2	= 'EN'
set @exmpt_special3	= 'EX366'
set @exmpt_special4	= 'FR'
set @exmpt_special5	= 'HT'
set @exmpt_special6	= 'PC'
set @exmpt_special7	= 'PRO'
set @exmpt_special8	= 'SO'


declare @found_hs		varchar(1)
declare @found_ov65		varchar(1)
declare @found_dp		varchar(1)
declare @found_dv1		varchar(1)
declare @found_dv1s		varchar(1)
declare @found_dv2		varchar(1)
declare @found_dv2s		varchar(1)
declare @found_dv3		varchar(1)
declare @found_dv3s		varchar(1)
declare @found_dv4		varchar(1)
declare @found_dv4s		varchar(1)
declare @found_ex		varchar(1)
declare @found_agtim		varchar(1)
declare @found_special1		varchar(1)
declare @found_special2		varchar(1)
declare @found_special3		varchar(1)
declare @found_special4		varchar(1)
declare @found_special5		varchar(1)
declare @found_special6		varchar(1)
declare @found_special7	  	varchar(1)
declare @found_special8	  	varchar(1)
declare @prop_id	  	int
declare @exmpt_type_cd	  	varchar(5)
declare @next_event_id	  	int
declare @event_desc	  	varchar(2048)

declare @removed_hs	  	varchar(1)
declare @removed_ov65	  	varchar(1)
declare @removed_dp	  	varchar(1)
declare @removed_dv1	  	varchar(1)
declare @removed_dv1s	  	varchar(1)
declare @removed_dv2	  	varchar(1)
declare @removed_dv2s	  	varchar(1)
declare @removed_dv3	  	varchar(1)
declare @removed_dv3s	  	varchar(1)
declare @removed_dv4	  	varchar(1)
declare @removed_dv4s	  	varchar(1)
declare @removed_ex	  	varchar(1)
declare @removed_agtim	  	varchar(1)
declare @removed_special1 	varchar(1)
declare @removed_special2 	varchar(1)
declare @removed_special3 	varchar(1)
declare @removed_special4 	varchar(1)
declare @removed_special5 	varchar(1)
declare @removed_special6 	varchar(1)
declare @removed_special7 	varchar(1)
declare @removed_special8 	varchar(1)


--First, drop and create a table for tracking purposes...
if exists (select * from sysobjects where id = object_id(N'[dbo].[_eoy_reset_list]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
drop table [dbo].[_eoy_reset_list]

CREATE TABLE [dbo].[_eoy_reset_list] (
	[prop_id] [int] NOT NULL ,
	[prop_val_yr] [numeric](4, 0) NOT NULL ,
	[reset_flag] [varchar] (1) NULL ,
	[reset_date] [datetime] NULL ,
	[have_exemptions] [varchar] (1) NULL 
) ON [PRIMARY]

ALTER TABLE [dbo].[_eoy_reset_list] WITH NOCHECK ADD 
CONSTRAINT [PK__eoy_reset_list] PRIMARY KEY  NONCLUSTERED 
(
	[prop_id],
	[prop_val_yr]
)  ON [PRIMARY] 

--Second, create and add a system_event...
-------
--BEGIN
-------

set @event_desc = 'Reset Exemptions Process has been executed.  **Reset Exemption Options:'
			+ (case when @reset_hs 	    = 'T' then ' (HS)' 	    else '' end)
			+ (case when @reset_hsov65  = 'T' then ' (HS/OV65)' else '' end)
			+ (case when @reset_hsdp    = 'T' then ' (HS/DP)'   else '' end)
			+ (case when @reset_dv      = 'T' then ' (DV)' 	    else '' end)
			+ (case when @reset_ex      = 'T' then ' (EX)'      else '' end)
			+ (case when @reset_agtim   = 'T' then ' (AG)'      else '' end)
			+ (case when @reset_special = 'T' then ' (AB/EN/EX366/FR/HT/PC/PRO/SO)' else '' end)
			+ ' **Reset HS Flag on Land & Improvements: ' + (case when @option_hs = 'T' then 'YES' else 'NO' end)

exec dbo.InsertSystemEvent 'EOY', @event_desc, 9999

-------
--END
-------

DECLARE EOY_EXEMPTION_LIST_VW SCROLL CURSOR
	FOR select distinct(prop_id)
	from 	 eoy_exemption_list_vw
	where 	 owner_tax_yr = @input_yr
	order by prop_id

OPEN EOY_EXEMPTION_LIST_VW
FETCH NEXT FROM EOY_EXEMPTION_LIST_VW into @prop_id

while (@@FETCH_STATUS = 0)
begin
	--Initialize variables
	set @found_hs 	 	= 'F'
	set @found_ov65 	= 'F'
	set @found_dp 	 	= 'F'
	set @found_dv1 	 	= 'F'
	set @found_dv1s 	= 'F'
	set @found_dv2 	 	= 'F'
	set @found_dv2s 	= 'F'
	set @found_dv3 	 	= 'F'
	set @found_dv3s 	= 'F'
	set @found_dv4 	 	= 'F'
	set @found_dv4s 	= 'F'
	set @found_ex 	 	= 'F'
	set @found_agtim 	= 'F'
	set @found_special1 	= 'F'
	set @found_special2 	= 'F'
	set @found_special3 	= 'F'
	set @found_special4 	= 'F'
	set @found_special5 	= 'F'
	set @found_special6 	= 'F'
	set @found_special7 	= 'F'
	set @found_special8 	= 'F'
	set @removed_hs	 	= 'F'
	set @removed_ov65	= 'F'
	set @removed_dp	 	= 'F'
	set @removed_dv1	= 'F'
	set @removed_dv1s	= 'F'
	set @removed_dv2	= 'F'
	set @removed_dv2s	= 'F'
	set @removed_dv3	= 'F'
	set @removed_dv3s	= 'F'
	set @removed_dv4	= 'F'
	set @removed_dv4s	= 'F'
	set @removed_ex	 	= 'F'
	set @removed_agtim	= 'F'
	set @removed_special1 	= 'F'
	set @removed_special2 	= 'F'
	set @removed_special3 	= 'F'
	set @removed_special4 	= 'F'
	set @removed_special5 	= 'F'
	set @removed_special6 	= 'F'
	set @removed_special7 	= 'F'
	set @removed_special8 	= 'F'

	DECLARE PROPERTY_EXEMPTION SCROLL CURSOR
	FOR select exmpt_type_cd
	from 	property_exemption, prop_supp_assoc 
	where 	property_exemption.prop_id 	= prop_supp_assoc.prop_id
	and 	property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
	and 	property_exemption.sup_num 	= prop_supp_assoc.sup_num
	and 	property_exemption.owner_tax_yr = @input_yr
	and 	property_exemption.prop_id 	= @prop_id
	order by exmpt_type_cd

	OPEN PROPERTY_EXEMPTION
	FETCH NEXT FROM PROPERTY_EXEMPTION into @exmpt_type_cd

	while (@@FETCH_STATUS = 0)
	begin
		if (@exmpt_type_cd = @exmpt_hs)
		begin
			set @found_hs = 'T'
		end
		else if ((@exmpt_type_cd = @exmpt_ov65) or (@exmpt_type_cd = @exmpt_ov65s))
		begin
			set @found_ov65 = 'T'
		end
		else if (@exmpt_type_cd = @exmpt_dp)
		begin
			set @found_dp = 'T'
		end
		else if (@exmpt_type_cd = @exmpt_dv1)
		begin
			set @found_dv1 = 'T'
		end
		else if (@exmpt_type_cd = @exmpt_dv1s)
		begin
			set @found_dv1s = 'T'
		end
		else if (@exmpt_type_cd = @exmpt_dv2)
		begin
			set @found_dv2 = 'T'
		end
		else if (@exmpt_type_cd = @exmpt_dv2s)
		begin
			set @found_dv2s = 'T'
		end
		else if (@exmpt_type_cd = @exmpt_dv3)
		begin
			set @found_dv3 = 'T'
		end
		else if (@exmpt_type_cd = @exmpt_dv3s)
		begin
			set @found_dv3s = 'T'
		end
		else if (@exmpt_type_cd = @exmpt_dv4)
		begin
			set @found_dv4 = 'T'
		end
		else if (@exmpt_type_cd = @exmpt_dv4s)
		begin
			set @found_dv4s = 'T'
		end
		else if (@exmpt_type_cd = @exmpt_ex)
		begin
			set @found_ex = 'T'
		end
		else if (@exmpt_type_cd = @exmpt_ag)
		begin
			set @found_agtim = 'T'
		end
		else if (@exmpt_type_cd = @exmpt_special1)
		begin
			set @found_special1 = 'T'
		end
		else if (@exmpt_type_cd = @exmpt_special2)
		begin
			set @found_special2 = 'T'
		end
		else if (@exmpt_type_cd = @exmpt_special3)
		begin
			set @found_special3 = 'T'
		end
		else if (@exmpt_type_cd = @exmpt_special4)
		begin
			set @found_special4 = 'T'
		end
		else if (@exmpt_type_cd = @exmpt_special5)
		begin
			set @found_special5 = 'T'
		end
		else if (@exmpt_type_cd = @exmpt_special6)
		begin
			set @found_special6 = 'T'
		end
		else if (@exmpt_type_cd = @exmpt_special7)
		begin
			set @found_special7 = 'T'
		end
		else if (@exmpt_type_cd = @exmpt_special8)
		begin
			set @found_special8 = 'T'
		end

		FETCH NEXT FROM PROPERTY_EXEMPTION into @exmpt_type_cd
	end

	CLOSE PROPERTY_EXEMPTION
	DEALLOCATE PROPERTY_EXEMPTION

	--If the property only has a HS exemption, then delete the exemptions!
	if ((@reset_hs 		= 'T')
	and (@found_hs 		= 'T')
	and (@found_ov65 	= 'F')
	and (@found_dp 		= 'F')
	--and (@found_dv1 	= 'F')
	--and (@found_dv1s 	= 'F')
	--and (@found_dv2 	= 'F')
	--and (@found_dv2s 	= 'F')
	--and (@found_dv3 	= 'F')
	--and (@found_dv3s 	= 'F')
	--and (@found_dv4 	= 'F')
	--and (@found_dv4s	= 'F')
	and (@found_ex 		= 'F')
	--and (@found_agtim 	= 'F')
	and (@found_special1 	= 'F')
	and (@found_special2 	= 'F')
	and (@found_special3 	= 'F')
	and (@found_special4 	= 'F')
	and (@found_special5 	= 'F')
	and (@found_special6 	= 'F')
	and (@found_special7 	= 'F')
	and (@found_special8 	= 'F'))
	begin
		if exists (select * from property_entity_exemption, prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_hs)
		begin
			delete from property_entity_exemption from prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_hs
		end

		if exists (select * from property_exemption, prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_hs)
		begin
			delete f
			from property_freeze as f
			join prop_supp_assoc as psa on
				psa.owner_tax_yr = f.exmpt_tax_yr and
				psa.sup_num = f.sup_num and
				psa.prop_id = f.prop_id
			join property_exemption as pe on
				pe.exmpt_tax_yr = f.exmpt_tax_yr and
				pe.owner_tax_yr = f.owner_tax_yr and
				pe.sup_num = f.sup_num and
				pe.prop_id = f.prop_id and
				pe.owner_id = f.owner_id and
				pe.exmpt_type_cd = f.exmpt_type_cd
			where
				f.exmpt_tax_yr = @input_yr and
				f.prop_id = @prop_id and
				f.exmpt_type_cd = @exmpt_hs

			delete from property_exemption from prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_hs

			set @removed_hs = 'T'
		end
	end

	--If the property has a HS and an OV65(S), then delete the exemptions!
	if ((@reset_hsov65	= 'T')
	and (@found_hs 		= 'T')
	and (@found_ov65 	= 'T'))
	begin
		--Debug
		--select debug = 'Found HS and OV65, delete option = HS,OV65'

		if exists (select * from property_entity_exemption, prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and (property_entity_exemption.exmpt_type_cd = @exmpt_hs
				or  property_entity_exemption.exmpt_type_cd = @exmpt_ov65
				or  property_entity_exemption.exmpt_type_cd = @exmpt_ov65s))
		begin
			delete from property_entity_exemption from prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and (property_entity_exemption.exmpt_type_cd = @exmpt_hs
				or  property_entity_exemption.exmpt_type_cd = @exmpt_ov65
				or  property_entity_exemption.exmpt_type_cd = @exmpt_ov65s)
		end

		if exists (select * from property_exemption, prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and (property_exemption.exmpt_type_cd = @exmpt_hs
				or  property_exemption.exmpt_type_cd = @exmpt_ov65
				or  property_exemption.exmpt_type_cd = @exmpt_ov65s))
		begin
			delete f
			from property_freeze as f
			join prop_supp_assoc as psa on
				psa.owner_tax_yr = f.exmpt_tax_yr and
				psa.sup_num = f.sup_num and
				psa.prop_id = f.prop_id
			join property_exemption as pe on
				pe.exmpt_tax_yr = f.exmpt_tax_yr and
				pe.owner_tax_yr = f.owner_tax_yr and
				pe.sup_num = f.sup_num and
				pe.prop_id = f.prop_id and
				pe.owner_id = f.owner_id and
				pe.exmpt_type_cd = f.exmpt_type_cd
			where
				f.exmpt_tax_yr = @input_yr and
				f.prop_id = @prop_id and
				(
					f.exmpt_type_cd = @exmpt_hs or
					f.exmpt_type_cd = @exmpt_ov65 or
					f.exmpt_type_cd = @exmpt_ov65s
				)

			delete from property_exemption from prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and (property_exemption.exmpt_type_cd = @exmpt_hs
				or  property_exemption.exmpt_type_cd = @exmpt_ov65
				or  property_exemption.exmpt_type_cd = @exmpt_ov65s)

			set @removed_hs = 'T'
			set @removed_ov65 = 'T'
		end
	end

	--If the property has a HS and a DP exemption, then delete the exemptions!
	if ((@reset_hsdp	= 'T')
	and (@found_hs 		= 'T')
	and (@found_dp 		= 'T'))
	begin
		if exists (select * from property_entity_exemption, prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and (property_entity_exemption.exmpt_type_cd = @exmpt_hs
				or  property_entity_exemption.exmpt_type_cd = @exmpt_dp))
		begin
			delete from property_entity_exemption from prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and (property_entity_exemption.exmpt_type_cd = @exmpt_hs
				or  property_entity_exemption.exmpt_type_cd = @exmpt_dp)
		end

		if exists (select * from property_exemption, prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and (property_exemption.exmpt_type_cd = @exmpt_hs
				or  property_exemption.exmpt_type_cd = @exmpt_dp))
		begin
			delete f
			from property_freeze as f
			join prop_supp_assoc as psa on
				psa.owner_tax_yr = f.exmpt_tax_yr and
				psa.sup_num = f.sup_num and
				psa.prop_id = f.prop_id
			join property_exemption as pe on
				pe.exmpt_tax_yr = f.exmpt_tax_yr and
				pe.owner_tax_yr = f.owner_tax_yr and
				pe.sup_num = f.sup_num and
				pe.prop_id = f.prop_id and
				pe.owner_id = f.owner_id and
				pe.exmpt_type_cd = f.exmpt_type_cd
			where
				f.exmpt_tax_yr = @input_yr and
				f.prop_id = @prop_id and
				(
					f.exmpt_type_cd = @exmpt_hs or
					f.exmpt_type_cd = @exmpt_dp
				)

			delete from property_exemption from prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and (property_exemption.exmpt_type_cd = @exmpt_hs
				or  property_exemption.exmpt_type_cd = @exmpt_dp)

			set @removed_hs = 'T'
			set @removed_dp = 'T'
		end
	end

	--If the property has a DV1 exemption, then delete the exemption!
	if ((@reset_dv = 'T') and (@found_dv1 = 'T'))
	begin
		if exists (select * from property_entity_exemption, prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_dv1)
		begin
			delete from property_entity_exemption from prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_dv1
		end

		if exists (select * from property_exemption, prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_dv1)
		begin
			delete f
			from property_freeze as f
			join prop_supp_assoc as psa on
				psa.owner_tax_yr = f.exmpt_tax_yr and
				psa.sup_num = f.sup_num and
				psa.prop_id = f.prop_id
			join property_exemption as pe on
				pe.exmpt_tax_yr = f.exmpt_tax_yr and
				pe.owner_tax_yr = f.owner_tax_yr and
				pe.sup_num = f.sup_num and
				pe.prop_id = f.prop_id and
				pe.owner_id = f.owner_id and
				pe.exmpt_type_cd = f.exmpt_type_cd
			where
				f.exmpt_tax_yr = @input_yr and
				f.prop_id = @prop_id and
				f.exmpt_type_cd = @exmpt_dv1

			delete from property_exemption from prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_dv1

			set @removed_dv1 = 'T'
		end

		if ((@reset_hs = 'T') and (@found_hs = 'T'))
		begin
			if exists (select * from property_entity_exemption, prop_supp_assoc
					where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
					and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
					and property_entity_exemption.owner_tax_yr = @input_yr
					and property_entity_exemption.prop_id = @prop_id
					and property_entity_exemption.exmpt_type_cd = @exmpt_hs)
			begin
				delete from property_entity_exemption from prop_supp_assoc
					where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
					and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
					and property_entity_exemption.owner_tax_yr = @input_yr
					and property_entity_exemption.prop_id = @prop_id
					and property_entity_exemption.exmpt_type_cd = @exmpt_hs
			end

			if exists (select * from property_exemption, prop_supp_assoc where 
					property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_exemption.prop_id = prop_supp_assoc.prop_id
					and property_exemption.sup_num = prop_supp_assoc.sup_num
					and property_exemption.owner_tax_yr = @input_yr
					and property_exemption.prop_id = @prop_id
					and property_exemption.exmpt_type_cd = @exmpt_hs)
			begin
				delete f
				from property_freeze as f
				join prop_supp_assoc as psa on
					psa.owner_tax_yr = f.exmpt_tax_yr and
					psa.sup_num = f.sup_num and
					psa.prop_id = f.prop_id
				join property_exemption as pe on
					pe.exmpt_tax_yr = f.exmpt_tax_yr and
					pe.owner_tax_yr = f.owner_tax_yr and
					pe.sup_num = f.sup_num and
					pe.prop_id = f.prop_id and
					pe.owner_id = f.owner_id and
					pe.exmpt_type_cd = f.exmpt_type_cd
				where
					f.exmpt_tax_yr = @input_yr and
					f.prop_id = @prop_id and
					f.exmpt_type_cd = @exmpt_hs

				delete from property_exemption from prop_supp_assoc where 
					property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_exemption.prop_id = prop_supp_assoc.prop_id
					and property_exemption.sup_num = prop_supp_assoc.sup_num
					and property_exemption.owner_tax_yr = @input_yr
					and property_exemption.prop_id = @prop_id
					and property_exemption.exmpt_type_cd = @exmpt_hs

				set @removed_hs = 'T'
			end
		end
	end

	--If the property has a DV1S exemption, then delete the exemption!
	if ((@reset_dv = 'T') and (@found_dv1s = 'T'))
	begin
		if exists (select * from property_entity_exemption, prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_dv1s)
		begin
			delete from property_entity_exemption from prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_dv1s
		end

		if exists (select * from property_exemption, prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_dv1s)
		begin
			delete f
			from property_freeze as f
			join prop_supp_assoc as psa on
				psa.owner_tax_yr = f.exmpt_tax_yr and
				psa.sup_num = f.sup_num and
				psa.prop_id = f.prop_id
			join property_exemption as pe on
				pe.exmpt_tax_yr = f.exmpt_tax_yr and
				pe.owner_tax_yr = f.owner_tax_yr and
				pe.sup_num = f.sup_num and
				pe.prop_id = f.prop_id and
				pe.owner_id = f.owner_id and
				pe.exmpt_type_cd = f.exmpt_type_cd
			where
				f.exmpt_tax_yr = @input_yr and
				f.prop_id = @prop_id and
				f.exmpt_type_cd = @exmpt_dv1s

			delete from property_exemption from prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_dv1s

			set @removed_dv1s = 'T'
		end

		if ((@reset_hs = 'T') and (@found_hs = 'T'))
		begin
			if exists (select * from property_entity_exemption, prop_supp_assoc
					where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
					and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
					and property_entity_exemption.owner_tax_yr = @input_yr
					and property_entity_exemption.prop_id = @prop_id
					and property_entity_exemption.exmpt_type_cd = @exmpt_hs)
			begin
				delete from property_entity_exemption from prop_supp_assoc
					where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
					and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
					and property_entity_exemption.owner_tax_yr = @input_yr
					and property_entity_exemption.prop_id = @prop_id
					and property_entity_exemption.exmpt_type_cd = @exmpt_hs
			end

			if exists (select * from property_exemption, prop_supp_assoc where 
					property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_exemption.prop_id = prop_supp_assoc.prop_id
					and property_exemption.sup_num = prop_supp_assoc.sup_num
					and property_exemption.owner_tax_yr = @input_yr
					and property_exemption.prop_id = @prop_id
					and property_exemption.exmpt_type_cd = @exmpt_hs)
			begin
				delete f
				from property_freeze as f
				join prop_supp_assoc as psa on
					psa.owner_tax_yr = f.exmpt_tax_yr and
					psa.sup_num = f.sup_num and
					psa.prop_id = f.prop_id
				join property_exemption as pe on
					pe.exmpt_tax_yr = f.exmpt_tax_yr and
					pe.owner_tax_yr = f.owner_tax_yr and
					pe.sup_num = f.sup_num and
					pe.prop_id = f.prop_id and
					pe.owner_id = f.owner_id and
					pe.exmpt_type_cd = f.exmpt_type_cd
				where
					f.exmpt_tax_yr = @input_yr and
					f.prop_id = @prop_id and
					f.exmpt_type_cd = @exmpt_hs

				delete from property_exemption from prop_supp_assoc where 
					property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_exemption.prop_id = prop_supp_assoc.prop_id
					and property_exemption.sup_num = prop_supp_assoc.sup_num
					and property_exemption.owner_tax_yr = @input_yr
					and property_exemption.prop_id = @prop_id
					and property_exemption.exmpt_type_cd = @exmpt_hs

				set @removed_hs = 'T'
			end
		end
	end

	--If the property has a DV2 exemption, then delete the exemption!
	if ((@reset_dv = 'T') and (@found_dv2 = 'T'))
	begin
		if exists (select * from property_entity_exemption, prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_dv2)
		begin
			delete from property_entity_exemption from prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_dv2
		end

		if exists (select * from property_exemption, prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_dv2)
		begin
			delete f
			from property_freeze as f
			join prop_supp_assoc as psa on
				psa.owner_tax_yr = f.exmpt_tax_yr and
				psa.sup_num = f.sup_num and
				psa.prop_id = f.prop_id
			join property_exemption as pe on
				pe.exmpt_tax_yr = f.exmpt_tax_yr and
				pe.owner_tax_yr = f.owner_tax_yr and
				pe.sup_num = f.sup_num and
				pe.prop_id = f.prop_id and
				pe.owner_id = f.owner_id and
				pe.exmpt_type_cd = f.exmpt_type_cd
			where
				f.exmpt_tax_yr = @input_yr and
				f.prop_id = @prop_id and
				f.exmpt_type_cd = @exmpt_dv2

			delete from property_exemption from prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_dv2

			set @removed_dv2 = 'T'
		end

		if ((@reset_hs = 'T') and (@found_hs = 'T'))
		begin
			if exists (select * from property_entity_exemption, prop_supp_assoc
					where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
					and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
					and property_entity_exemption.owner_tax_yr = @input_yr
					and property_entity_exemption.prop_id = @prop_id
					and property_entity_exemption.exmpt_type_cd = @exmpt_hs)
			begin
				delete from property_entity_exemption from prop_supp_assoc
					where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
					and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
					and property_entity_exemption.owner_tax_yr = @input_yr
					and property_entity_exemption.prop_id = @prop_id
					and property_entity_exemption.exmpt_type_cd = @exmpt_hs
			end

			if exists (select * from property_exemption, prop_supp_assoc where 
					property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_exemption.prop_id = prop_supp_assoc.prop_id
					and property_exemption.sup_num = prop_supp_assoc.sup_num
					and property_exemption.owner_tax_yr = @input_yr
					and property_exemption.prop_id = @prop_id
					and property_exemption.exmpt_type_cd = @exmpt_hs)
			begin
				delete f
				from property_freeze as f
				join prop_supp_assoc as psa on
					psa.owner_tax_yr = f.exmpt_tax_yr and
					psa.sup_num = f.sup_num and
					psa.prop_id = f.prop_id
				join property_exemption as pe on
					pe.exmpt_tax_yr = f.exmpt_tax_yr and
					pe.owner_tax_yr = f.owner_tax_yr and
					pe.sup_num = f.sup_num and
					pe.prop_id = f.prop_id and
					pe.owner_id = f.owner_id and
					pe.exmpt_type_cd = f.exmpt_type_cd
				where
					f.exmpt_tax_yr = @input_yr and
					f.prop_id = @prop_id and
					f.exmpt_type_cd = @exmpt_hs

				delete from property_exemption from prop_supp_assoc where 
					property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_exemption.prop_id = prop_supp_assoc.prop_id
					and property_exemption.sup_num = prop_supp_assoc.sup_num
					and property_exemption.owner_tax_yr = @input_yr
					and property_exemption.prop_id = @prop_id
					and property_exemption.exmpt_type_cd = @exmpt_hs

				set @removed_hs = 'T'
			end
		end
	end

	--If the property has a DV2S exemption, then delete the exemption!
	if ((@reset_dv = 'T') and (@found_dv2s = 'T'))
	begin
		if exists (select * from property_entity_exemption, prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_dv2s)
		begin
			delete from property_entity_exemption from prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_dv2s
		end

		if exists (select * from property_exemption, prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_dv2s)
		begin
			delete f
			from property_freeze as f
			join prop_supp_assoc as psa on
				psa.owner_tax_yr = f.exmpt_tax_yr and
				psa.sup_num = f.sup_num and
				psa.prop_id = f.prop_id
			join property_exemption as pe on
				pe.exmpt_tax_yr = f.exmpt_tax_yr and
				pe.owner_tax_yr = f.owner_tax_yr and
				pe.sup_num = f.sup_num and
				pe.prop_id = f.prop_id and
				pe.owner_id = f.owner_id and
				pe.exmpt_type_cd = f.exmpt_type_cd
			where
				f.exmpt_tax_yr = @input_yr and
				f.prop_id = @prop_id and
				f.exmpt_type_cd = @exmpt_dv2s

			delete from property_exemption from prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_dv2s

			set @removed_dv2s = 'T'
		end

		if ((@reset_hs = 'T') and (@found_hs = 'T'))
		begin
			if exists (select * from property_entity_exemption, prop_supp_assoc
					where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
					and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
					and property_entity_exemption.owner_tax_yr = @input_yr
					and property_entity_exemption.prop_id = @prop_id
					and property_entity_exemption.exmpt_type_cd = @exmpt_hs)
			begin
				delete from property_entity_exemption from prop_supp_assoc
					where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
					and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
					and property_entity_exemption.owner_tax_yr = @input_yr
					and property_entity_exemption.prop_id = @prop_id
					and property_entity_exemption.exmpt_type_cd = @exmpt_hs
			end

			if exists (select * from property_exemption, prop_supp_assoc where 
					property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_exemption.prop_id = prop_supp_assoc.prop_id
					and property_exemption.sup_num = prop_supp_assoc.sup_num
					and property_exemption.owner_tax_yr = @input_yr
					and property_exemption.prop_id = @prop_id
					and property_exemption.exmpt_type_cd = @exmpt_hs)
			begin
				delete f
				from property_freeze as f
				join prop_supp_assoc as psa on
					psa.owner_tax_yr = f.exmpt_tax_yr and
					psa.sup_num = f.sup_num and
					psa.prop_id = f.prop_id
				join property_exemption as pe on
					pe.exmpt_tax_yr = f.exmpt_tax_yr and
					pe.owner_tax_yr = f.owner_tax_yr and
					pe.sup_num = f.sup_num and
					pe.prop_id = f.prop_id and
					pe.owner_id = f.owner_id and
					pe.exmpt_type_cd = f.exmpt_type_cd
				where
					f.exmpt_tax_yr = @input_yr and
					f.prop_id = @prop_id and
					f.exmpt_type_cd = @exmpt_hs

				delete from property_exemption from prop_supp_assoc where 
					property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_exemption.prop_id = prop_supp_assoc.prop_id
					and property_exemption.sup_num = prop_supp_assoc.sup_num
					and property_exemption.owner_tax_yr = @input_yr
					and property_exemption.prop_id = @prop_id
					and property_exemption.exmpt_type_cd = @exmpt_hs

				set @removed_hs = 'T'
			end
		end
	end

	--If the property has a DV3 exemption, then delete the exemption!
	if ((@reset_dv = 'T') and (@found_dv3 = 'T'))
	begin
		if exists (select * from property_entity_exemption, prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_dv3)
		begin
			delete from property_entity_exemption from prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_dv3
		end

		if exists (select * from property_exemption, prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_dv3)
		begin
			delete f
			from property_freeze as f
			join prop_supp_assoc as psa on
				psa.owner_tax_yr = f.exmpt_tax_yr and
				psa.sup_num = f.sup_num and
				psa.prop_id = f.prop_id
			join property_exemption as pe on
				pe.exmpt_tax_yr = f.exmpt_tax_yr and
				pe.owner_tax_yr = f.owner_tax_yr and
				pe.sup_num = f.sup_num and
				pe.prop_id = f.prop_id and
				pe.owner_id = f.owner_id and
				pe.exmpt_type_cd = f.exmpt_type_cd
			where
				f.exmpt_tax_yr = @input_yr and
				f.prop_id = @prop_id and
				f.exmpt_type_cd = @exmpt_dv3

			delete from property_exemption from prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_dv3

			set @removed_dv3 = 'T'
		end

		if ((@reset_hs = 'T') and (@found_hs = 'T'))
		begin
			if exists (select * from property_entity_exemption, prop_supp_assoc
					where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
					and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
					and property_entity_exemption.owner_tax_yr = @input_yr
					and property_entity_exemption.prop_id = @prop_id
					and property_entity_exemption.exmpt_type_cd = @exmpt_hs)
			begin
				delete from property_entity_exemption from prop_supp_assoc
					where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
					and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
					and property_entity_exemption.owner_tax_yr = @input_yr
					and property_entity_exemption.prop_id = @prop_id
					and property_entity_exemption.exmpt_type_cd = @exmpt_hs
			end

			if exists (select * from property_exemption, prop_supp_assoc where 
					property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_exemption.prop_id = prop_supp_assoc.prop_id
					and property_exemption.sup_num = prop_supp_assoc.sup_num
					and property_exemption.owner_tax_yr = @input_yr
					and property_exemption.prop_id = @prop_id
					and property_exemption.exmpt_type_cd = @exmpt_hs)
			begin
				delete f
				from property_freeze as f
				join prop_supp_assoc as psa on
					psa.owner_tax_yr = f.exmpt_tax_yr and
					psa.sup_num = f.sup_num and
					psa.prop_id = f.prop_id
				join property_exemption as pe on
					pe.exmpt_tax_yr = f.exmpt_tax_yr and
					pe.owner_tax_yr = f.owner_tax_yr and
					pe.sup_num = f.sup_num and
					pe.prop_id = f.prop_id and
					pe.owner_id = f.owner_id and
					pe.exmpt_type_cd = f.exmpt_type_cd
				where
					f.exmpt_tax_yr = @input_yr and
					f.prop_id = @prop_id and
					f.exmpt_type_cd = @exmpt_hs

				delete from property_exemption from prop_supp_assoc where 
					property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_exemption.prop_id = prop_supp_assoc.prop_id
					and property_exemption.sup_num = prop_supp_assoc.sup_num
					and property_exemption.owner_tax_yr = @input_yr
					and property_exemption.prop_id = @prop_id
					and property_exemption.exmpt_type_cd = @exmpt_hs

				set @removed_hs = 'T'
			end
		end
	end

	--If the property has a DV3S exemption, then delete the exemption!
	if ((@reset_dv = 'T') and (@found_dv3s = 'T'))
	begin
		if exists (select * from property_entity_exemption, prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_dv3s)
		begin
			delete from property_entity_exemption from prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_dv3s
		end

		if exists (select * from property_exemption, prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_dv3s)
		begin
			delete f
			from property_freeze as f
			join prop_supp_assoc as psa on
				psa.owner_tax_yr = f.exmpt_tax_yr and
				psa.sup_num = f.sup_num and
				psa.prop_id = f.prop_id
			join property_exemption as pe on
				pe.exmpt_tax_yr = f.exmpt_tax_yr and
				pe.owner_tax_yr = f.owner_tax_yr and
				pe.sup_num = f.sup_num and
				pe.prop_id = f.prop_id and
				pe.owner_id = f.owner_id and
				pe.exmpt_type_cd = f.exmpt_type_cd
			where
				f.exmpt_tax_yr = @input_yr and
				f.prop_id = @prop_id and
				f.exmpt_type_cd = @exmpt_dv3s

			delete from property_exemption from prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_dv3s

			set @removed_dv3s = 'T'
		end

		if ((@reset_hs = 'T') and (@found_hs = 'T'))
		begin
			if exists (select * from property_entity_exemption, prop_supp_assoc
					where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
					and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
					and property_entity_exemption.owner_tax_yr = @input_yr
					and property_entity_exemption.prop_id = @prop_id
					and property_entity_exemption.exmpt_type_cd = @exmpt_hs)
			begin
				delete from property_entity_exemption from prop_supp_assoc
					where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
					and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
					and property_entity_exemption.owner_tax_yr = @input_yr
					and property_entity_exemption.prop_id = @prop_id
					and property_entity_exemption.exmpt_type_cd = @exmpt_hs
			end

			if exists (select * from property_exemption, prop_supp_assoc where 
					property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_exemption.prop_id = prop_supp_assoc.prop_id
					and property_exemption.sup_num = prop_supp_assoc.sup_num
					and property_exemption.owner_tax_yr = @input_yr
					and property_exemption.prop_id = @prop_id
					and property_exemption.exmpt_type_cd = @exmpt_hs)
			begin
				delete f
				from property_freeze as f
				join prop_supp_assoc as psa on
					psa.owner_tax_yr = f.exmpt_tax_yr and
					psa.sup_num = f.sup_num and
					psa.prop_id = f.prop_id
				join property_exemption as pe on
					pe.exmpt_tax_yr = f.exmpt_tax_yr and
					pe.owner_tax_yr = f.owner_tax_yr and
					pe.sup_num = f.sup_num and
					pe.prop_id = f.prop_id and
					pe.owner_id = f.owner_id and
					pe.exmpt_type_cd = f.exmpt_type_cd
				where
					f.exmpt_tax_yr = @input_yr and
					f.prop_id = @prop_id and
					f.exmpt_type_cd = @exmpt_hs

				delete from property_exemption from prop_supp_assoc where 
					property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_exemption.prop_id = prop_supp_assoc.prop_id
					and property_exemption.sup_num = prop_supp_assoc.sup_num
					and property_exemption.owner_tax_yr = @input_yr
					and property_exemption.prop_id = @prop_id
					and property_exemption.exmpt_type_cd = @exmpt_hs

				set @removed_hs = 'T'
			end
		end
	end

	--If the property has a DV4 exemption, then delete the exemption!
	if ((@reset_dv = 'T') and (@found_dv4 = 'T'))
	begin
		if exists (select * from property_entity_exemption, prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_dv4)
		begin
			delete from property_entity_exemption from prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_dv4
		end

		if exists (select * from property_exemption, prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_dv4)
		begin
			delete f
			from property_freeze as f
			join prop_supp_assoc as psa on
				psa.owner_tax_yr = f.exmpt_tax_yr and
				psa.sup_num = f.sup_num and
				psa.prop_id = f.prop_id
			join property_exemption as pe on
				pe.exmpt_tax_yr = f.exmpt_tax_yr and
				pe.owner_tax_yr = f.owner_tax_yr and
				pe.sup_num = f.sup_num and
				pe.prop_id = f.prop_id and
				pe.owner_id = f.owner_id and
				pe.exmpt_type_cd = f.exmpt_type_cd
			where
				f.exmpt_tax_yr = @input_yr and
				f.prop_id = @prop_id and
				f.exmpt_type_cd = @exmpt_dv4

			delete from property_exemption from prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_dv4

			set @removed_dv4 = 'T'
		end

		if ((@reset_hs = 'T') and (@found_hs = 'T'))
		begin
			if exists (select * from property_entity_exemption, prop_supp_assoc
					where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
					and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
					and property_entity_exemption.owner_tax_yr = @input_yr
					and property_entity_exemption.prop_id = @prop_id
					and property_entity_exemption.exmpt_type_cd = @exmpt_hs)
			begin
				delete from property_entity_exemption from prop_supp_assoc
					where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
					and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
					and property_entity_exemption.owner_tax_yr = @input_yr
					and property_entity_exemption.prop_id = @prop_id
					and property_entity_exemption.exmpt_type_cd = @exmpt_hs
			end

			if exists (select * from property_exemption, prop_supp_assoc where 
					property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_exemption.prop_id = prop_supp_assoc.prop_id
					and property_exemption.sup_num = prop_supp_assoc.sup_num
					and property_exemption.owner_tax_yr = @input_yr
					and property_exemption.prop_id = @prop_id
					and property_exemption.exmpt_type_cd = @exmpt_hs)
			begin
				delete f
				from property_freeze as f
				join prop_supp_assoc as psa on
					psa.owner_tax_yr = f.exmpt_tax_yr and
					psa.sup_num = f.sup_num and
					psa.prop_id = f.prop_id
				join property_exemption as pe on
					pe.exmpt_tax_yr = f.exmpt_tax_yr and
					pe.owner_tax_yr = f.owner_tax_yr and
					pe.sup_num = f.sup_num and
					pe.prop_id = f.prop_id and
					pe.owner_id = f.owner_id and
					pe.exmpt_type_cd = f.exmpt_type_cd
				where
					f.exmpt_tax_yr = @input_yr and
					f.prop_id = @prop_id and
					f.exmpt_type_cd = @exmpt_hs

				delete from property_exemption from prop_supp_assoc where 
					property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_exemption.prop_id = prop_supp_assoc.prop_id
					and property_exemption.sup_num = prop_supp_assoc.sup_num
					and property_exemption.owner_tax_yr = @input_yr
					and property_exemption.prop_id = @prop_id
					and property_exemption.exmpt_type_cd = @exmpt_hs

				set @removed_hs = 'T'
			end
		end
	end

	--If the property has a DV4S exemption, then delete the exemption!
	if ((@reset_dv = 'T') and (@found_dv4s = 'T'))
	begin
		if exists (select * from property_entity_exemption, prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_dv4s)
		begin
			delete from property_entity_exemption from prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_dv4s
		end

		if exists (select * from property_exemption, prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_dv4s)
		begin
			delete f
			from property_freeze as f
			join prop_supp_assoc as psa on
				psa.owner_tax_yr = f.exmpt_tax_yr and
				psa.sup_num = f.sup_num and
				psa.prop_id = f.prop_id
			join property_exemption as pe on
				pe.exmpt_tax_yr = f.exmpt_tax_yr and
				pe.owner_tax_yr = f.owner_tax_yr and
				pe.sup_num = f.sup_num and
				pe.prop_id = f.prop_id and
				pe.owner_id = f.owner_id and
				pe.exmpt_type_cd = f.exmpt_type_cd
			where
				f.exmpt_tax_yr = @input_yr and
				f.prop_id = @prop_id and
				f.exmpt_type_cd = @exmpt_dv4s

			delete from property_exemption from prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_dv4s

			set @removed_dv4s = 'T'
		end

		if ((@reset_hs = 'T') and (@found_hs = 'T'))
		begin
			if exists (select * from property_entity_exemption, prop_supp_assoc
					where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
					and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
					and property_entity_exemption.owner_tax_yr = @input_yr
					and property_entity_exemption.prop_id = @prop_id
					and property_entity_exemption.exmpt_type_cd = @exmpt_hs)
			begin
				delete from property_entity_exemption from prop_supp_assoc
					where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
					and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
					and property_entity_exemption.owner_tax_yr = @input_yr
					and property_entity_exemption.prop_id = @prop_id
					and property_entity_exemption.exmpt_type_cd = @exmpt_hs
			end

			if exists (select * from property_exemption, prop_supp_assoc where 
					property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_exemption.prop_id = prop_supp_assoc.prop_id
					and property_exemption.sup_num = prop_supp_assoc.sup_num
					and property_exemption.owner_tax_yr = @input_yr
					and property_exemption.prop_id = @prop_id
					and property_exemption.exmpt_type_cd = @exmpt_hs)
			begin
				delete f
				from property_freeze as f
				join prop_supp_assoc as psa on
					psa.owner_tax_yr = f.exmpt_tax_yr and
					psa.sup_num = f.sup_num and
					psa.prop_id = f.prop_id
				join property_exemption as pe on
					pe.exmpt_tax_yr = f.exmpt_tax_yr and
					pe.owner_tax_yr = f.owner_tax_yr and
					pe.sup_num = f.sup_num and
					pe.prop_id = f.prop_id and
					pe.owner_id = f.owner_id and
					pe.exmpt_type_cd = f.exmpt_type_cd
				where
					f.exmpt_tax_yr = @input_yr and
					f.prop_id = @prop_id and
					f.exmpt_type_cd = @exmpt_hs

				delete from property_exemption from prop_supp_assoc where 
					property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
					and property_exemption.prop_id = prop_supp_assoc.prop_id
					and property_exemption.sup_num = prop_supp_assoc.sup_num
					and property_exemption.owner_tax_yr = @input_yr
					and property_exemption.prop_id = @prop_id
					and property_exemption.exmpt_type_cd = @exmpt_hs

				set @removed_hs = 'T'
			end
		end
	end

	--If the property has an EX exemption, then delete the exemption!
	if ((@reset_ex = 'T') and (@found_ex = 'T'))
	begin
		if exists (select * from property_entity_exemption, prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_ex)
		begin
			delete from property_entity_exemption from prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_ex
		end

		if exists (select * from property_exemption, prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_ex)
		begin
			delete f
			from property_freeze as f
			join prop_supp_assoc as psa on
				psa.owner_tax_yr = f.exmpt_tax_yr and
				psa.sup_num = f.sup_num and
				psa.prop_id = f.prop_id
			join property_exemption as pe on
				pe.exmpt_tax_yr = f.exmpt_tax_yr and
				pe.owner_tax_yr = f.owner_tax_yr and
				pe.sup_num = f.sup_num and
				pe.prop_id = f.prop_id and
				pe.owner_id = f.owner_id and
				pe.exmpt_type_cd = f.exmpt_type_cd
			where
				f.exmpt_tax_yr = @input_yr and
				f.prop_id = @prop_id and
				f.exmpt_type_cd = @exmpt_ex

			delete from property_exemption from prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_ex

			set @removed_ex = 'T'
		end
	end

	if ((@reset_agtim = 'T') and (@found_agtim = 'T'))
	begin
		set @removed_agtim = 'T'
	end

	--If the property has an AB exemption, then delete the exemption!
	if ((@reset_special = 'T') and (@found_special1 = 'T'))
	begin
		if exists (select * from property_entity_exemption, prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_special1)
		begin
			delete from property_entity_exemption from prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_special1
		end

		if exists (select * from property_exemption, prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_special1)
		begin
			delete f
			from property_freeze as f
			join prop_supp_assoc as psa on
				psa.owner_tax_yr = f.exmpt_tax_yr and
				psa.sup_num = f.sup_num and
				psa.prop_id = f.prop_id
			join property_exemption as pe on
				pe.exmpt_tax_yr = f.exmpt_tax_yr and
				pe.owner_tax_yr = f.owner_tax_yr and
				pe.sup_num = f.sup_num and
				pe.prop_id = f.prop_id and
				pe.owner_id = f.owner_id and
				pe.exmpt_type_cd = f.exmpt_type_cd
			where
				f.exmpt_tax_yr = @input_yr and
				f.prop_id = @prop_id and
				f.exmpt_type_cd = @exmpt_special1

			delete from property_exemption from prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_special1

			set @removed_special1 = 'T'
		end
	end

	--If the property has an EN exemption, then delete the exemption!
	if ((@reset_special = 'T') and (@found_special2 = 'T'))
	begin
		if exists (select * from property_entity_exemption, prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_special2)
		begin
			delete from property_entity_exemption from prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_special2
		end

		if exists (select * from property_exemption, prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_special2)
		begin
			delete f
			from property_freeze as f
			join prop_supp_assoc as psa on
				psa.owner_tax_yr = f.exmpt_tax_yr and
				psa.sup_num = f.sup_num and
				psa.prop_id = f.prop_id
			join property_exemption as pe on
				pe.exmpt_tax_yr = f.exmpt_tax_yr and
				pe.owner_tax_yr = f.owner_tax_yr and
				pe.sup_num = f.sup_num and
				pe.prop_id = f.prop_id and
				pe.owner_id = f.owner_id and
				pe.exmpt_type_cd = f.exmpt_type_cd
			where
				f.exmpt_tax_yr = @input_yr and
				f.prop_id = @prop_id and
				f.exmpt_type_cd = @exmpt_special2

			delete from property_exemption from prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_special2

			set @removed_special2 = 'T'
		end
	end

	--If the property has an EX366 exemption, then delete the exemption!
	if ((@reset_special = 'T') and (@found_special3 = 'T'))
	begin
		if exists (select * from property_entity_exemption, prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_special3)
		begin
			delete from property_entity_exemption from prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_special3
		end

		if exists (select * from property_exemption, prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_special3)
		begin
			delete f
			from property_freeze as f
			join prop_supp_assoc as psa on
				psa.owner_tax_yr = f.exmpt_tax_yr and
				psa.sup_num = f.sup_num and
				psa.prop_id = f.prop_id
			join property_exemption as pe on
				pe.exmpt_tax_yr = f.exmpt_tax_yr and
				pe.owner_tax_yr = f.owner_tax_yr and
				pe.sup_num = f.sup_num and
				pe.prop_id = f.prop_id and
				pe.owner_id = f.owner_id and
				pe.exmpt_type_cd = f.exmpt_type_cd
			where
				f.exmpt_tax_yr = @input_yr and
				f.prop_id = @prop_id and
				f.exmpt_type_cd = @exmpt_special3

			delete from property_exemption from prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_special3

			set @removed_special3 = 'T'
		end
	end

	--If the property has an FR exemption, then delete the exemption!
	if ((@reset_special = 'T') and (@found_special4 = 'T'))
	begin
	if exists (select * from property_entity_exemption, prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_special4)
		begin
			delete from property_entity_exemption from prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_special4
		end

		if exists (select * from property_exemption, prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_special4)
		begin
			delete f
			from property_freeze as f
			join prop_supp_assoc as psa on
				psa.owner_tax_yr = f.exmpt_tax_yr and
				psa.sup_num = f.sup_num and
				psa.prop_id = f.prop_id
			join property_exemption as pe on
				pe.exmpt_tax_yr = f.exmpt_tax_yr and
				pe.owner_tax_yr = f.owner_tax_yr and
				pe.sup_num = f.sup_num and
				pe.prop_id = f.prop_id and
				pe.owner_id = f.owner_id and
				pe.exmpt_type_cd = f.exmpt_type_cd
			where
				f.exmpt_tax_yr = @input_yr and
				f.prop_id = @prop_id and
				f.exmpt_type_cd = @exmpt_special4

			delete from property_exemption from prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_special4

			set @removed_special4 = 'T'
		end
	end

	--If the property has an HT exemption, then delete the exemption!
	if ((@reset_special = 'T') and (@found_special5 = 'T'))
	begin
		if exists (select * from property_entity_exemption, prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_special5)

		begin
			delete from property_entity_exemption from prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_special5
		end

		if exists (select * from property_exemption, prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_special5)
		begin
			delete f
			from property_freeze as f
			join prop_supp_assoc as psa on
				psa.owner_tax_yr = f.exmpt_tax_yr and
				psa.sup_num = f.sup_num and
				psa.prop_id = f.prop_id
			join property_exemption as pe on
				pe.exmpt_tax_yr = f.exmpt_tax_yr and
				pe.owner_tax_yr = f.owner_tax_yr and
				pe.sup_num = f.sup_num and
				pe.prop_id = f.prop_id and
				pe.owner_id = f.owner_id and
				pe.exmpt_type_cd = f.exmpt_type_cd
			where
				f.exmpt_tax_yr = @input_yr and
				f.prop_id = @prop_id and
				f.exmpt_type_cd = @exmpt_special5

			delete from property_exemption from prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_special5

			set @removed_special5 = 'T'
		end
	end

	--If the property has an PC exemption, then delete the exemption!
	if ((@reset_special = 'T') and (@found_special6 = 'T'))
	begin
		if exists (select * from property_entity_exemption, prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_special6)
		begin
			delete from property_entity_exemption from prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_special6
		end

		if exists (select * from property_exemption, prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_special6)
		begin
			delete f
			from property_freeze as f
			join prop_supp_assoc as psa on
				psa.owner_tax_yr = f.exmpt_tax_yr and
				psa.sup_num = f.sup_num and
				psa.prop_id = f.prop_id
			join property_exemption as pe on
				pe.exmpt_tax_yr = f.exmpt_tax_yr and
				pe.owner_tax_yr = f.owner_tax_yr and
				pe.sup_num = f.sup_num and
				pe.prop_id = f.prop_id and
				pe.owner_id = f.owner_id and
				pe.exmpt_type_cd = f.exmpt_type_cd
			where
				f.exmpt_tax_yr = @input_yr and
				f.prop_id = @prop_id and
				f.exmpt_type_cd = @exmpt_special6

			delete from property_exemption from prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_special6

			set @removed_special6 = 'T'
		end
	end

	--If the property has an PRO exemption, then delete the exemption!
	if ((@reset_special = 'T') and (@found_special7 = 'T'))
	begin
		if exists (select * from property_entity_exemption, prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_special7)
		begin
			delete from property_entity_exemption from prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_special7
		end

		if exists (select * from property_exemption, prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_special7)
		begin
			delete f
			from property_freeze as f
			join prop_supp_assoc as psa on
				psa.owner_tax_yr = f.exmpt_tax_yr and
				psa.sup_num = f.sup_num and
				psa.prop_id = f.prop_id
			join property_exemption as pe on
				pe.exmpt_tax_yr = f.exmpt_tax_yr and
				pe.owner_tax_yr = f.owner_tax_yr and
				pe.sup_num = f.sup_num and
				pe.prop_id = f.prop_id and
				pe.owner_id = f.owner_id and
				pe.exmpt_type_cd = f.exmpt_type_cd
			where
				f.exmpt_tax_yr = @input_yr and
				f.prop_id = @prop_id and
				f.exmpt_type_cd = @exmpt_special7

			delete from property_exemption from prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_special7

			set @removed_special7 = 'T'
		end
	end

	--If the property has an SO exemption, then delete the exemption!
	if ((@reset_special = 'T') and (@found_special8 = 'T'))
	begin
		if exists (select * from property_entity_exemption, prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_special8)
		begin
			delete from property_entity_exemption from prop_supp_assoc
				where property_entity_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_entity_exemption.sup_num = prop_supp_assoc.sup_num
				and property_entity_exemption.prop_id = prop_supp_assoc.prop_id
				and property_entity_exemption.owner_tax_yr = @input_yr
				and property_entity_exemption.prop_id = @prop_id
				and property_entity_exemption.exmpt_type_cd = @exmpt_special8
		end

		if exists (select * from property_exemption, prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_special8)
		begin
			delete f
			from property_freeze as f
			join prop_supp_assoc as psa on
				psa.owner_tax_yr = f.exmpt_tax_yr and
				psa.sup_num = f.sup_num and
				psa.prop_id = f.prop_id
			join property_exemption as pe on
				pe.exmpt_tax_yr = f.exmpt_tax_yr and
				pe.owner_tax_yr = f.owner_tax_yr and
				pe.sup_num = f.sup_num and
				pe.prop_id = f.prop_id and
				pe.owner_id = f.owner_id and
				pe.exmpt_type_cd = f.exmpt_type_cd
			where
				f.exmpt_tax_yr = @input_yr and
				f.prop_id = @prop_id and
				f.exmpt_type_cd = @exmpt_special8

			delete from property_exemption from prop_supp_assoc where 
				property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
				and property_exemption.prop_id = prop_supp_assoc.prop_id
				and property_exemption.sup_num = prop_supp_assoc.sup_num
				and property_exemption.owner_tax_yr = @input_yr
				and property_exemption.prop_id = @prop_id
				and property_exemption.exmpt_type_cd = @exmpt_special8

			set @removed_special8 = 'T'
		end
	end

	--Now create and add an event; This will be associated with each property...
	-------
	--BEGIN
	-------

	set @event_desc = ''

	--Here we are going to build some text that will let the user know which exemptions were removed.
	if (@removed_hs = 'T')
	begin
		set @event_desc = @event_desc + 'HS Exemption Removed.  '
	end

	if (@removed_ov65 = 'T')
	begin
		set @event_desc = @event_desc + 'OV65(S) Exemption Removed. '
	end

	if (@removed_dp	= 'T')
	begin
		set @event_desc = @event_desc + 'DP Exemption Removed. '
	end

	if (@removed_dv1 = 'T')
	begin
		set @event_desc = @event_desc + 'DV1 Exemption Removed. '
	end

	if (@removed_dv1s = 'T')
	begin
		set @event_desc = @event_desc + 'DV1S Exemption Removed. '
	end

	if (@removed_dv2 = 'T')
	begin
		set @event_desc = @event_desc + 'DV2 Exemption Removed. '
	end

	if (@removed_dv2s = 'T')
	begin
		set @event_desc = @event_desc + 'DV2S Exemption Removed. '
	end

	if (@removed_dv3 = 'T')
	begin
		set @event_desc = @event_desc + 'DV3 Exemption Removed. '
	end

	if (@removed_dv3s = 'T')
	begin
		set @event_desc = @event_desc + 'DV3S Exemption Removed. '
	end

	if (@removed_dv4 = 'T')
	begin
		set @event_desc = @event_desc + 'DV4 Exemption Removed. '
	end

	if (@removed_dv4s = 'T')
	begin
		set @event_desc = @event_desc + 'DV4S Exemption Removed. '
	end

	if (@removed_ex = 'T')
	begin
		set @event_desc = @event_desc + 'EX Exemption Removed. '
	end

	if (@removed_agtim = 'T')
	begin
		--Don't need to tell the user about an AG exemption begin removed since there isn't really such thing as an AG exemption...
		--However, we do need to set the ag_apply flag back to a 'F' for all land_details
		update land_detail set ag_apply = 'F', ag_use_cd = null from land_detail, prop_supp_assoc, property
		where land_detail.prop_id = prop_supp_assoc.prop_id
		and land_detail.prop_val_yr = prop_supp_assoc.owner_tax_yr
		and land_detail.sup_num = prop_supp_assoc.sup_num
		and prop_supp_assoc.prop_id = property.prop_id
		and property.exmpt_reset = 'T'
		and prop_supp_assoc.owner_tax_yr = @input_yr
		and prop_supp_assoc.prop_id = @prop_id
	end

	if (@removed_special1 = 'T')
	begin
		set @event_desc = @event_desc + 'AB Special Exemption Removed. '
	end

	if (@removed_special2 = 'T')
	begin
		set @event_desc = @event_desc + 'EN Special Exemption Removed. '
	end

	if (@removed_special3 = 'T')
	begin
		set @event_desc = @event_desc + 'EX366 Special Exemption Removed. '
	end

	if (@removed_special4 = 'T')
	begin
		set @event_desc = @event_desc + 'FR Special Exemption Removed. '
	end

	if (@removed_special5 = 'T')
	begin
		set @event_desc = @event_desc + 'HT Special Exemption Removed. '
	end

	if (@removed_special6 = 'T')
	begin
		set @event_desc = @event_desc + 'PC Special Exemption Removed. '
	end

	if (@removed_special7 = 'T')
	begin
		set @event_desc = @event_desc + 'PRO Special Exemption Removed. '
	end

	if (@removed_special8 = 'T')
	begin
		set @event_desc = @event_desc + 'SO Special Exemption Removed. '
	end

	if (@option_hs = 'T')
	begin
		set @event_desc = @event_desc + 'Homesite Flag reset on Land & Improvements. '
	end

	if (@event_desc <> '')
	begin
		exec dbo.GetUniqueID 'event', @next_event_id output, 1, 0
		
		--Add the event
		insert into event
		(
			event_id,
			system_type,
			event_type,
			event_date,
			pacs_user,
			event_desc,
			ref_evt_type,
			ref_year,
			ref_id1,
			pacs_user_id
		)
		values
		(
			@next_event_id,
			'A',
			'SYSTEM',
			GetDate(),
			'System',
			@event_desc,
			'EOYRE',
			@input_yr,
			@prop_id,
			1
		)

		--Now tie the event to the property
		insert into prop_event_assoc
		(
			prop_id,
			event_id
		)
		values
		(
			@prop_id,
			@next_event_id
		)
	end
	-------
	--END
	-------
	
	--Get the next property and repeat
	FETCH NEXT FROM EOY_EXEMPTION_LIST_VW into @prop_id
end

--Add the properties to the temp table for tracking purposes that have exemptions...
insert into _eoy_reset_list
(
	prop_id,
	prop_val_yr,
	reset_flag,
	reset_date,
	have_exemptions
)
select distinct
	prop_id,
	@input_yr,
	'T',
	GetDate(),
	'T'
from eoy_exemption_list_vw
where owner_tax_yr = @input_yr

--Add the properties to the temp table for tracking purposes that have NO exemptions...
insert into _eoy_reset_list
(
	prop_id,
	prop_val_yr,
	reset_flag,
	reset_date,
	have_exemptions
)
select distinct
	prop_id,
	@input_yr,
	'T',
	GetDate(),
	'F'
from property
where exmpt_reset = 'T'
and prop_id not in (select prop_id from eoy_exemption_list_vw
			where owner_tax_yr = @input_yr)

--We also need to reset the homesite flag for all land (T or F) and improvements (Y or N)
if (@option_hs = 'T')
begin
	--Improvements...
	update imprv set imprv_homesite = 'N'
	from imprv, prop_supp_assoc, property
	where imprv.prop_id 		= prop_supp_assoc.prop_id
	and imprv.sup_num 		= prop_supp_assoc.sup_num
	and imprv.prop_val_yr 		= prop_supp_assoc.owner_tax_yr
	and prop_supp_assoc.prop_id 	= property.prop_id
	and property.exmpt_reset 	= 'T'
	and prop_supp_assoc.owner_tax_yr = @input_yr

	--Land...
	update land_detail set land_seg_homesite = 'F'
	from land_detail, prop_supp_assoc, property
	where land_detail.prop_id 	= prop_supp_assoc.prop_id
	and land_detail.prop_val_yr 	= prop_supp_assoc.owner_tax_yr
	and land_detail.sup_num 	= prop_supp_assoc.sup_num
	and prop_supp_assoc.prop_id 	= property.prop_id
	and property.exmpt_reset 	= 'T'
	and prop_supp_assoc.owner_tax_yr = @input_yr
end	

--Flag the properties as needing to be recalculated; 'M' is for Modified...
update property_val set recalc_flag = 'M'
from prop_supp_assoc, property
where property_val.prop_id 	= prop_supp_assoc.prop_id
and   property_val.sup_num 	= prop_supp_assoc.sup_num
and   property_val.prop_val_yr 	= prop_supp_assoc.owner_tax_yr
and   property_val.prop_id	= property.prop_id
and   property.exmpt_reset	= 'T'
and   property_val.prop_val_yr 	= @input_yr

--Do some extra cleanup from the EOY processing...
delete from property_exemption
where exmpt_type_cd = 'AG'

--Update the exmpt_reset flag = 'F' for the properties since we are DONE!!
update property set exmpt_reset = 'F'
where (exmpt_reset = 'T') or (exmpt_reset is null)

CLOSE EOY_EXEMPTION_LIST_VW
DEALLOCATE EOY_EXEMPTION_LIST_VW

--Since the HS exemptions have been possibly altered, mass update the owner.hs_prop field.

--DISABLE OWNER TRIGGERS
exec dbo.TriggerEnable 'owner', 0

update owner with(tablockx)
set
	owner.hs_prop = case
		when pe.prop_id is null
		then 'F'
		else 'T'
	end
from owner with(tablockx)
left outer join property_exemption as pe with(tablockx) on
	pe.exmpt_tax_yr = owner.owner_tax_yr and
	pe.owner_tax_yr = owner.owner_tax_yr and
	pe.sup_num = owner.sup_num and
	pe.prop_id = owner.prop_id and
	pe.owner_id = owner.owner_id and
	pe.exmpt_type_cd = 'HS'
where
	isnull(owner.hs_prop, 'F') <> case when pe.prop_id is null then 'F' else 'T' end

--ENABLE ALL TRIGGERS
exec dbo.TriggerEnable 'owner', 1

GO

