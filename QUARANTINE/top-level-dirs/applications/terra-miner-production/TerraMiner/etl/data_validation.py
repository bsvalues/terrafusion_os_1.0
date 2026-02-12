"""
data_validation.py

Provides reusable data validation, normalization, and deduplication utilities for ETL pipelines.
"""
import re
import string
from typing import Any, Dict, List, Optional
from rapidfuzz import fuzz

def validate_required_fields(record: Dict[str, Any], required_fields: List[str]) -> bool:
    """
    Ensure all required fields are present and non-empty.
    """
    for field in required_fields:
        if field not in record or record[field] in (None, '', [], {}):
            return False
    return True

def normalize_string(value: Optional[str]) -> Optional[str]:
    """
    Normalize a string: strip, lowercase, remove punctuation, unify whitespace, and title case.
    """
    if value is None:
        return None
    value = str(value).strip().lower()
    value = value.translate(str.maketrans('', '', string.punctuation))
    value = re.sub(r'\s+', ' ', value)
    return value.title()

def normalize_address(address: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize address fields: canonical case, remove punctuation, unify whitespace, uppercase state, zero-pad zip.
    """
    out = dict(address)
    if 'street' in out:
        out['street'] = normalize_string(out['street'])
    if 'city' in out:
        out['city'] = normalize_string(out['city'])
    if 'state' in out:
        out['state'] = str(out['state']).strip().upper()
    if 'zip' in out:
        digits = re.sub(r'[^0-9]', '', str(out['zip']))
        out['zip'] = digits[:5].zfill(5)
    return out

def deduplicate_records(records: List[Dict[str, Any]], key_fields: List[str]) -> List[Dict[str, Any]]:
    """
    Deduplicate records using strict key matching on specified fields.
    """
    seen = set()
    unique = []
    for rec in records:
        key = tuple(rec.get(f) for f in key_fields)
        if key not in seen:
            seen.add(key)
            unique.append(rec)
    return unique

def fuzzy_deduplicate_records(records: List[Dict[str, Any]], address_field: str = "address", threshold: int = 98) -> List[Dict[str, Any]]:
    """
    Deduplicate records using fuzzy address similarity (ratio via rapidfuzz).
    Only keeps the first occurrence of near-duplicates (similarity >= threshold).
    Args:
        records: List of property records (dicts)
        address_field: Field name containing the address dict or string
        threshold: Similarity ratio (0-100) above which records are considered duplicates
    Returns:
        List of deduplicated records
    """
    unique = []
    seen = []
    for rec in records:
        addr = rec.get(address_field)
        if isinstance(addr, dict):
            addr_str = ' '.join([
                normalize_string(str(addr.get('street', ''))),
                normalize_string(str(addr.get('city', ''))),
                normalize_string(str(addr.get('state', ''))),
                normalize_string(str(addr.get('zip', '')))
            ])
        else:
            addr_str = normalize_string(str(addr))
        is_dup = False
        for seen_addr in seen:
            if fuzz.ratio(addr_str, seen_addr) >= threshold:
                street_num1 = re.split(r'\D+', addr_str)[0]
                street_num2 = re.split(r'\D+', seen_addr)[0]
                if street_num1 != street_num2:
                    continue
                is_dup = True
                break
        if not is_dup:
            unique.append(rec)
            seen.append(addr_str)
    return unique

def validate_zip(zip_code: Any) -> bool:
    return bool(re.match(r'^\d{5}$', str(zip_code)))

# Add more validators/normalizers as needed for your domain.
