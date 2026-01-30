from typing import Dict, Any
from .schema_map import PacsSchema

def sql_row_to_lattice_node(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Pure Function: SQL Row -> AxiomFS Node
    """
    if not row:
        return None
        
    parcel_id = str(row.get(PacsSchema.COL_PARCEL_ID))
    prop_id = str(row.get(PacsSchema.COL_PROP_ID))
    
    # Logic: If we have a situs address, it's verified.
    status = "verified" if row.get(PacsSchema.COL_SITUS) else "pending"

    return {
        "id": f"PARCEL-{parcel_id}", 
        "type": "entity",
        "label": row.get(PacsSchema.COL_SITUS) or f"Parcel {parcel_id}",
        "status": status,
        "tags": ["real-estate", "commercial" if "COMM" in str(row.get(PacsSchema.COL_LEGAL, "")) else "residential"],
        "relations": [], 
        "metadata": {
            "legalDescription": row.get(PacsSchema.COL_LEGAL),
            "pacsId": prop_id,
            "neighborhood": row.get(PacsSchema.COL_NBHD),
            "source": "jcharrispacs"
        }
    }
