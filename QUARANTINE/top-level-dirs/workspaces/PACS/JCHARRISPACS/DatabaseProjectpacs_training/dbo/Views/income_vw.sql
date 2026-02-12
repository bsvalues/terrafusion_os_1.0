









CREATE        view income_vw

as

select 
income_id,
sup_num,
income_yr,
econ_area,  
prop_type_cd, 
class,      
level_cd,
prop_name,
GBA,              
NRA, 
value_method,
yr_blt,
stories,     
  
land_excess_value  as LAND,  
lu_cost as LEASEUP_COSTS   , 
case when value_method = 'DC'   then DC_LA 
     when value_method = 'SCH'  then SCH_LA
     when value_method = 'PF'   then PF_LA 
     when value_method = 'FLAT' then 0 
     when value_method = 'DCF'  then 0 end as LA,   
case when value_method = 'DC'   then DC_TAX
     when value_method = 'SCH'  then SCH_TAX
     when value_method = 'PF'   then PF_TAX
     when value_method = 'FLAT' then 0 
     when value_method = 'DCF'  then 0 end as TAX,      
case when value_method = 'DC'   then DC_VA 
     when value_method = 'SCH'  then SCH_VA
     when value_method = 'PF'   then PF_VA 
     when value_method = 'FLAT' then 0 
     when value_method = 'DCF'  then 0 end as VA,        
case when value_method = 'DC'   then DC_BE 
     when value_method = 'SCH'  then SCH_BE
     when value_method = 'PF'   then PF_BE 
     when value_method = 'FLAT' then 0 
     when value_method = 'DCF'  then 0 end as BE,        
case when value_method = 'DC'   then DC_OR 
     when value_method = 'SCH'  then SCH_OR
     when value_method = 'PF'   then PF_OR
     when value_method = 'FLAT' then 0  
     when value_method = 'DCF'  then 0 end as OCR,        
case when value_method = 'DC'   then DC_VR 
     when value_method = 'SCH'  then SCH_VR
     when value_method = 'PF'   then PF_VR 
     when value_method = 'FLAT' then 0  
     when value_method = 'DCF'  then 0 end as VR,        
case when value_method = 'DC'   then DC_LARate 
     when value_method = 'SCH'  then SCH_LARate
     when value_method = 'PF'   then PF_LARate 
     when value_method = 'FLAT' then 0  
     when value_method = 'DCF'  then 0 end as LARate,        
case when value_method = 'DC'   then DC_VARate 
     when value_method = 'SCH'  then SCH_VARate
     when value_method = 'PF'   then PF_VARate
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF'  then 0 end as VARate,        
case when value_method = 'DC'   then DC_LI 
     when value_method = 'SCH'  then SCH_LI
     when value_method = 'PF'   then PF_LI
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF'  then 0 end as LI,        
case when value_method = 'DC'   then DC_VI 
     when value_method = 'SCH'  then SCH_VI
     when value_method = 'PF'   then PF_VI
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF'  then 0 end as VI,        
case when value_method = 'DC'   then DC_GPI 
     when value_method = 'SCH'  then SCH_GPI
     when value_method = 'PF'   then PF_GPI
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF'  then 0 end as GPI,        
case when value_method = 'DC'   then DC_GPIVR 
     when value_method = 'SCH'  then SCH_GPIVR
     when value_method = 'PF'   then PF_GPIVR
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF'  then 0 end as GPIVR,     
case when value_method = 'DC'   then DC_GPIVI 
     when value_method = 'SCH'  then SCH_GPIVI
     when value_method = 'PF'   then PF_GPIVI
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF'  then 0 end as GPIVI,        
case when value_method = 'DC'   then DC_GPICLR 
     when value_method = 'SCH'  then SCH_GPICLR
     when value_method = 'PF'   then PF_GPICLR
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF'  then 0 end as GPICLR,        
case when value_method = 'DC'   then DC_GPICLI 
     when value_method = 'SCH'  then SCH_GPICLI
     when value_method = 'PF'   then PF_GPICLI
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF'  then 0 end as GPICLI,        
case when value_method = 'DC'   then DC_GPIRER 
     when value_method = 'SCH'  then SCH_GPIRER
     when value_method = 'PF'   then PF_GPIRER
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF'  then 0 end as GPIRER,        
case when value_method = 'DC'   then DC_GPIRE 
     when value_method = 'SCH'  then SCH_GPIRE
     when value_method = 'PF'   then PF_GPIRE
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF'  then 0 end as GPIRE,        
case when value_method = 'DC'   then DC_GPISIR 
     when value_method = 'SCH'  then SCH_GPISIR
     when value_method = 'PF'   then PF_GPISIR
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF'  then 0 end as GPISIR,        
case when value_method = 'DC'   then DC_GPISI 
     when value_method = 'SCH'  then SCH_GPISI
     when value_method = 'PF'   then PF_GPISI
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF'  then 0 end as GPISI,        
case when value_method = 'DC'   then DC_EGI 
     when value_method = 'SCH'  then SCH_EGI
     when value_method = 'PF'   then PF_EGI
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF'  then 0 end as EGI,        
case when value_method = 'DC'   then DC_EXPOEI 
     when value_method = 'SCH'  then SCH_EXPOEI
     when value_method = 'PF'   then PF_EXPOEI
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF'  then 0 end as EXPOEI,              
case when value_method = 'DC'   then DC_MGMTR 
     when value_method = 'SCH'  then SCH_MGMTR
     when value_method = 'PF'  then PF_MGMTR
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as MGMTR,        
case when value_method = 'DC'  then DC_MGMTI 
     when value_method = 'SCH' then SCH_MGMTI
     when value_method = 'PF'  then PF_MGMTI
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as MGMTI,        
case when value_method = 'DC'  then DC_RRR 
     when value_method = 'SCH' then SCH_RRR
     when value_method = 'PF'  then PF_RRR
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as RRR,        
case when value_method = 'DC'  then DC_RRI 
     when value_method = 'SCH' then SCH_RRI
     when value_method = 'PF'  then PF_RRI
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as RRI,
case when value_method = 'DC'  then DC_TIR
     when value_method = 'SCH' then SCH_TIR
     when value_method = 'PF'  then PF_TIR
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as TIR,  
case when value_method = 'DC'  then DC_TII 
     when value_method = 'SCH' then SCH_TII
     when value_method = 'PF'  then PF_TII
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as TII,  
case when value_method = 'DC'  then DC_LCR 
     when value_method = 'SCH' then SCH_LCR
     when value_method = 'PF'  then PF_LCR
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as LCR,  
case when value_method = 'DC'  then DC_LCI 
     when value_method = 'SCH' then SCH_LCI
     when value_method = 'PF'  then PF_LCI
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as LCI,  
case when value_method = 'DC'  then DC_EXP 
     when value_method = 'SCH' then SCH_EXP
     when value_method = 'PF'  then PF_EXP
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as TEXP,  
case when value_method = 'DC'  then DC_NOI 
     when value_method = 'SCH' then SCH_NOI
     when value_method = 'PF'  then PF_NOI
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as NOI,  
case when value_method = 'DC'  then DC_CAPR 
     when value_method = 'SCH' then SCH_CAPR
     when value_method = 'PF'  then PF_CAPR
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as CAPR,  
case when value_method = 'DC'  then DC_CAPI 
     when value_method = 'SCH' then SCH_CAPI
     when value_method = 'PF'  then PF_CAPI
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as CAPI,  
case when value_method = 'DC'  then DC_PERS 
     when value_method = 'SCH' then SCH_PERS
     when value_method = 'PF'  then PF_PERS
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as PERS,  
case when value_method = 'DC'  then DC_IND 
     when value_method = 'SCH' then SCH_IND
     when value_method = 'PF'  then PF_IND
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as IND,  
case when value_method = 'DC'  then DC_GPIRSF 
     when value_method = 'SCH' then SCH_GPIRSF
     when value_method = 'PF'  then PF_GPIRSF
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as GPIRSF,  
case when value_method = 'DC'  then DC_GPIVRSF 
     when value_method = 'SCH' then SCH_GPIVRSF
     when value_method = 'PF'  then PF_GPIVRSF
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as GPIVRSF,  
case when value_method = 'DC'  then DC_GPICLRSF 
     when value_method = 'SCH' then SCH_GPICLRSF
     when value_method = 'PF'  then PF_GPICLRSF
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as GPICLRSF,  
case when value_method = 'DC'  then DC_GPIRERSF 
     when value_method = 'SCH' then SCH_GPIRERSF
     when value_method = 'PF'  then PF_GPIRERSF
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as GPIRERSF,  
case when value_method = 'DC'  then DC_GPISIRSF 
     when value_method = 'SCH' then SCH_GPISIRSF
     when value_method = 'PF'  then PF_GPISIRSF
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as GPISIRSF,    
case when value_method = 'DC'  then DC_EGIRSF
     when value_method = 'SCH' then SCH_EGIRSF
     when value_method = 'PF'  then PF_EGIRSF
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as EGIRSF,    
case when value_method = 'DC'  then DC_EGIPCTREV 
     when value_method = 'SCH' then SCH_EGIPCTREV
     when value_method = 'PF'  then PF_EGIPCTREV
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as EGIPCTREV,    
case when value_method = 'DC'  then DC_EXPOERSF 
     when value_method = 'SCH' then SCH_EXPOERSF
     when value_method = 'PF'  then PF_EXPOERSF
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as EXPOERSF,    
case when value_method = 'DC'  then DC_EXPTAXRSF 
     when value_method = 'SCH' then SCH_EXPTAXRSF
     when value_method = 'PF'  then PF_EXPTAXRSF
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as EXPTAXRSF,    
case when value_method = 'DC'  then DC_EXPMGMTRSF 
     when value_method = 'SCH' then SCH_EXPMGMTRSF
     when value_method = 'PF'  then PF_EXPMGMTRSF
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as EXPMGMTRSF,    
case when value_method = 'DC'  then DC_RRRSF 
     when value_method = 'SCH' then SCH_RRRSF
     when value_method = 'PF'  then PF_RRRSF
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as RRRSF,    
case when value_method = 'DC'  then DC_EXPTIRSF 

     when value_method = 'SCH' then SCH_EXPTIRSF
     when value_method = 'PF'  then PF_EXPTIRSF
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as EXPTIRSF,    
case when value_method = 'DC'  then DC_EXPLCRSF 
     when value_method = 'SCH' then SCH_EXPLCRSF
     when value_method = 'PF'  then PF_EXPLCRSF
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as EXPLCRSF,    
case when value_method = 'DC'  then DC_EXPRSF 
     when value_method = 'SCH' then SCH_EXPRSF
     when value_method = 'PF'  then PF_EXPRSF
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as EXPRSF,    
case when value_method = 'DC'  then DC_EXPPCTREV 
     when value_method = 'SCH' then SCH_EXPPCTREV
     when value_method = 'PF'  then PF_EXPPCTREV
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as EXPPCTREV,    
case when value_method = 'DC'  then DC_NOIRSF 
     when value_method = 'SCH' then SCH_NOIRSF
     when value_method = 'PF'  then PF_NOIRSF
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as NOIRSF,    
case when value_method = 'DC'  then DC_NOIPCTREV 
     when value_method = 'SCH' then SCH_NOIPCTREV
     when value_method = 'PF'  then PF_NOIPCTREV
     when value_method = 'FLAT' then 0   
     when value_method = 'DCF' then 0 end as NOIPCTREV         

from income

GO

