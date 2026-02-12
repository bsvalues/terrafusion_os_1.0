/* $Id: st_cref_util.sps,v 1.3, 2006-05-10 19:46:43Z, Tom Gigler$ 
$NoKeywords$ */ 
CREATE OR REPLACE PACKAGE st_cref_util AS
/******************************************************************************
   NAME:       st_spref_util
   PURPOSE:

   REVISIONS:
   Ver        Date        Author           Description
   ---------  ----------  ---------------  ------------------------------------
   1.0        4/23/2005             1. Created this package.
******************************************************************************/

  C_package_release       CONSTANT PLS_INTEGER := 1001;
  C_package_guid          CONSTANT VARCHAR2 (32):= 'E869B7EE610C4AAAB8000628B7851FF8';

  SUBTYPE cref_record_t    IS &1..st_coordinate_systems%ROWTYPE;
  SUBTYPE cref_id_t        IS &1..st_coordinate_systems.id%TYPE;
  SUBTYPE cref_name_t      IS &1..st_coordinate_systems.name%TYPE;
  SUBTYPE cref_def_t       IS &1..st_coordinate_systems.definition%TYPE;

  PROCEDURE get_cref_id    (cref_name  IN cref_name_t,
                            cref_def   IN cref_def_t,
                            cref_id    IN OUT cref_id_t);
  
  PROCEDURE insert_cref    (cref_r  IN cref_record_t);

END st_cref_util;
/
