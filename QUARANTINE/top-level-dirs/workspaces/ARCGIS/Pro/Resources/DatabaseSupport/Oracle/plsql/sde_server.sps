/* $Id: sde_server.sps,v 1.4, 2006-05-03 19:04:05Z, Tom Gigler$ 
$NoKeywords$ */ 
CREATE OR REPLACE PACKAGE sde_server
/***********************************************************************
*
*N  {sde_server.sps}  --  Interface for the external procedure sde_server 
*                         package 
*
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*P  Purpose:
*     This PL/SQL package specification defines procedures to obtain
*   the servers mac address via an external procedure. It should be 
*   compiled by the SDE DBA user; security is by user name.   
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
*    Mark Harris           04/30/2003               Original coding.
*E
***********************************************************************/
IS

  /* Constants. */

   -- The following constant defines the release of sde_server, and is 
   -- used by the iomgr to determine if the most up to date version of the 
   -- package has been installed.

   C_package_release       CONSTANT PLS_INTEGER := 1000; 
   C_package_guid          CONSTANT VARCHAR2 (32):= '';

  /* Procedures and functions. */

   -- The following function returns the server's MAC address.

   FUNCTION getmacaddr RETURN VARCHAR2;
   PRAGMA RESTRICT_REFERENCES (sde_server,WNDS,WNPS); 

END sde_server;
/

