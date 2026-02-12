
CREATE   procedure ARBGetValues


@prop_id	int,
@prop_val_yr	numeric(4)

as

declare @land_hstd_val		numeric(14,0)
declare @land_non_hstd_val	numeric(14,0)
declare @imprv_hstd_val		numeric(14,0)
declare @imprv_non_hstd_val	numeric(14,0)
declare @ag_use_val		numeric(14,0)
declare @ag_market		numeric(14,0)
declare @timber_use		numeric(14,0)
declare @timber_market		numeric(14,0)
declare @market			numeric(14,0)
declare @appraised_val		numeric(14,0)
declare @ten_percent_cap	numeric(14,0)
declare @assessed_val		numeric(14,0)
declare @rendered_val		numeric(14,0)
declare @exemptions		varchar(50)
declare @entities 		varchar(50)
declare @recalc_dt		datetime

declare @sup_num		int
declare @entity_cd		varchar(5)
declare @exmpt_type_cd		varchar(5)

declare @ag_hs_use_val numeric(14,0)
declare @ag_hs_mkt_val numeric(14,0)
declare	@timber_hs_use_val numeric(14,0)
declare @timber_hs_mkt_val numeric(14,0)
declare @appraisedClassified numeric(14,0)
declare @appraisedNonClassified numeric(14,0)



set @exemptions = ''
set @entities   = ''


select @land_hstd_val      = pv.land_hstd_val,
       @land_non_hstd_val  = pv.land_non_hstd_val,
       @imprv_hstd_val     = pv.imprv_hstd_val,
       @imprv_non_hstd_val = pv.imprv_non_hstd_val,
       
       @ag_use_val	   = pv.ag_use_val,
       @ag_market	   = pv.ag_market,
       @timber_use	   = pv.timber_use,
       @timber_market	   = pv.timber_market,
           
       @market		   = pv.market,
       @appraised_val      = pv.appraised_val,   
       @ten_percent_cap    = pv.ten_percent_cap,
       @assessed_val       = pv.assessed_val,
       @rendered_val       = pv.rendered_val,
       @sup_num		   = pv.sup_num,
       @recalc_dt	   = pv.recalc_dt,
                 
       @ag_hs_use_val = pv.ag_hs_use_val,
       @ag_hs_mkt_val =  pv.ag_hs_mkt_val,
	   @timber_hs_use_val = pv.timber_hs_use_val,
       @timber_hs_mkt_val = pv.timber_hs_mkt_val
 
       
from property_val pv,
     prop_supp_assoc psa
   

where pv.prop_id 	= psa.prop_id
and   pv.sup_num 	= psa.sup_num
and   pv.prop_val_yr 	= psa.owner_tax_yr
and   pv.prop_id 	= @prop_id
and   pv.prop_val_yr 	= @prop_val_yr


select 
	@appraisedClassified = wpv.appraised_classified,
    @appraisedNonClassified = wpv.appraised_non_classified
from 
	wash_property_val wpv,
	prop_supp_assoc psa
where 
	wpv.prop_id 	= psa.prop_id and
	wpv.sup_num 	= psa.sup_num and
	wpv.prop_val_yr = psa.owner_tax_yr and
	wpv.prop_id 	= @prop_id and
	wpv.prop_val_yr = @prop_val_yr

	
-- get exemptions 

exec ARBGetExemptions @prop_id, @sup_num, @prop_val_yr, @exemptions output
exec ARBGetEntities   @prop_id, @sup_num, @prop_val_yr, @entities   output


select 	land_hstd_val      = @land_hstd_val,		
	land_non_hstd_val  = @land_non_hstd_val,	
	imprv_hstd_val     = @imprv_hstd_val,		
	imprv_non_hstd_val = @imprv_non_hstd_val,	
	ag_use_val	   = @ag_use_val,		
	ag_market	   = @ag_market,	
	timber_use	   = @timber_use,		
	timber_market	   = @timber_market,
	market		   = @market,			
	appraised_val	   = @appraised_val,		
	ten_percent_cap	   = @ten_percent_cap,	
	assessed_val	   = @assessed_val,		
	rendered_val	   = @rendered_val,		
	exemptions	   = @exemptions,		
	entities	   = @entities,
	dt		   = @recalc_dt,
	ag_hs_use_val = @ag_hs_use_val,
  ag_hs_mkt_val = @ag_hs_mkt_val,
	timber_hs_use_val = @timber_hs_use_val,
  timber_hs_mkt_val = @timber_hs_mkt_val,
	appraised_Classified = @appraisedClassified,
	appraised_NonClassified = @appraisedNonClassified

GO

