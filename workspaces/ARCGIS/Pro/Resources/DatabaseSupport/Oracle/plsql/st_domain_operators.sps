/* $Id: st_domain_operators.sps,v 1.12.1.0, 2008-12-16 17:43:19Z, Sanjay Magal$ */
CREATE OR REPLACE Package st_domain_operators Authid current_user
/***********************************************************************
*
*N  {st_domain_operators.sps}  --  ST_GEOM domain operators.  
*
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*P  Purpose:
*     This PL/SQL package specification defines operators 
*    to support the ST_GEOMETRY type and domain index.
*E
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*X  Legalese:
*
*   COPYRIGHT 1992-2004 ESRI
*
*   TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
*   Unpublished material - all rights reserved under the
*   Copyright Laws of the United States.
*
*   For additional information, contact:
*   Environmental Systems Research Institute, Inc.
*   Attn: Contracts Dept
*   380 New York Street
*   Redlands, California, USA 92373
*
*   email: contracts@esri.com
*   
*E
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*H  History:
*
*    Kevin Watt          12/02/04               Original coding.
*E
***********************************************************************/
IS

  c_package_release       Constant pls_integer := 1004;
  C_package_guid          CONSTANT VARCHAR2 (32):= '1DF4BEA150054F4F90F8DAFD4E86F9EC';

  Function st_envintersects_env_f(prim &1..st_geometry,
                                  minx number,miny number,maxx number,maxy number)
    Return number deterministic;
	
  Function st_envintersects_shape_f(prim &1..st_geometry,shape &1..st_geometry)
    Return number deterministic;

  Function st_envintersects_env_ord_f(prim &1..st_geometry,
                                      minx number,miny number,maxx number,maxy number,
                                      orderby varchar2)
    Return number deterministic;
    
  Function st_envintersects_shape_ord_f(prim &1..st_geometry,
                                        shape &1..st_geometry,
                                        orderby varchar2)
    Return number deterministic;
  
	
   Pragma Restrict_References (st_domain_operators,wnds,wnps);

End st_domain_operators;
/  
