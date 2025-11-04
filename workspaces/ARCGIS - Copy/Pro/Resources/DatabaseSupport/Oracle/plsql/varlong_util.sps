/* $Id: varlong_util.sps,v 1.6, 2006-05-03 19:04:01Z, Tom Gigler$ 
$NoKeywords$ */ 

CREATE OR REPLACE PACKAGE varlong_util
/***********************************************************************
*
*N  {varlong_util.sps}  --  Interface for package to manipulate varlongs
*
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*P  Purpose:
*     This PL/SQL package specification defines procedures to manipulate
*   PL/SQL RAW variables containing ESRI format compressed varlong
*   number strings.  A varlong is a endian-indepent compressed integer
*   format.
*   
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
*    Peter Aronson             04/20/00               Original coding.
*E
***********************************************************************/
IS

  /* Constants. */

   -- The following constant defines the release of varlong_util, and is 
   -- used by the installer to determine if the most up to date version of 
   -- the package has been installed.

   C_package_release       CONSTANT PLS_INTEGER := 1000;
   C_package_guid          CONSTANT VARCHAR2 (32):= '';

  /* Subprograms. */

   -- Function to unpack a varlong from a varlong string.  The start pos for
   -- the first integer is 1, and the start_pos variable updated on return to
   -- the start position of the next integer.

   FUNCTION unpack_varlong (varlong_buffer  IN      RAW,
                            start_pos       IN OUT  PLS_INTEGER) 
                            RETURN PLS_INTEGER;

   -- Procedure to append the supplied integer to the supplied varlong string.

   PROCEDURE pack_varlong (varlong_value   IN      PLS_INTEGER,
                           varlong_buffer  IN OUT  RAW);

   -- Function to determine how many bytes an integer would take up in varlong
   -- format (a number from 1 to 5 for a 32-bit integer).

   FUNCTION varlong_size  (varlong_value   IN      PLS_INTEGER)
                           RETURN PLS_INTEGER;

   PRAGMA RESTRICT_REFERENCES (varlong_util,RNDS,RNPS,WNDS,WNPS);
   PRAGMA RESTRICT_REFERENCES (unpack_varlong,RNDS,RNPS,WNDS,WNPS);
   PRAGMA RESTRICT_REFERENCES (varlong_size,RNDS,RNPS,WNDS,WNPS);

END varlong_util;
/
