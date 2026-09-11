#!/usr/bin/env python3
import hashlib
import json
import os
import re
import sys
import urllib.request
import zipfile
from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path
from xml.etree import ElementTree as ET

COUNTY = "Okanogan"
CODE = "047"
OFFICIAL = "https://okanogancounty.org"
SOURCE = "https://okanogancounty.org/DocumentCenter/View/8359"
SOURCE_FINAL = "https://www.okanogancounty.gov/DocumentCenter/View/8359/Real-Property-Sales-XLSX?bidId="
MODE = "public_assessor_official_real_property_sales_xlsx"
PAYLOAD = "okanogan-real-property-sales-2026-sanitized.json"
DEFAULT_ROOT = "frontend/apps/os-shell/public/launch-data/washington"


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def canonical_json(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha(value):
    return hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, separators=(",", ":"), ensure_ascii=False) + "\n", encoding="utf-8")


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def generated(value, generated_at):
    if isinstance(value, list):
        return [generated(item, generated_at) for item in value]
    if isinstance(value, dict):
        return {
            key: generated_at if key == "generatedAt" else generated(item, generated_at)
            for key, item in value.items()
        }
    return value


def download_xlsx():
    request = urllib.request.Request(
        SOURCE,
        headers={
            "User-Agent": "Mozilla/5.0 TerraFusion-WAL-public-source-ingestion",
            "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*",
        },
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        data = response.read()
        final_url = response.geturl()
        content_type = response.headers.get("Content-Type", "")
    require(data.startswith(b"PK\x03\x04"), "Okanogan source did not return an XLSX zip payload.")
    require("spreadsheetml" in content_type.lower(), f"Okanogan source returned unexpected content type {content_type!r}.")
    return data, final_url, content_type


def column_index(cell_ref):
    letters = re.match(r"([A-Z]+)", cell_ref).group(1)
    index = 0
    for char in letters:
        index = index * 26 + (ord(char) - ord("A") + 1)
    return index - 1


def excel_date(value):
    if value is None or value == "":
        return None
    serial = float(value)
    # Excel's 1900 date system includes a false 1900 leap day; 1899-12-30 is
    # the standard conversion base for Windows-authored XLSX serial dates.
    date_value = datetime(1899, 12, 30, tzinfo=timezone.utc) + timedelta(days=serial)
    return date_value.date().isoformat()


def as_text(value):
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def as_number(value):
    if value is None or value == "":
        return None
    text = str(value).replace(",", "").replace("$", "").strip()
    if not text:
        return None
    number = float(text)
    if not number or not (number > 0):
        return None
    if number.is_integer():
        return int(number)
    return number


def read_workbook_rows(data):
    ns = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    archive = zipfile.ZipFile(BytesIO(data))
    strings = []
    if "xl/sharedStrings.xml" in archive.namelist():
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
        for item in root.findall("a:si", ns):
            strings.append("".join(text.text or "" for text in item.findall(".//a:t", ns)))

    sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
    rows = []
    for row in sheet.findall(".//a:sheetData/a:row", ns):
        cells = {}
        max_index = -1
        for cell in row.findall("a:c", ns):
            ref = cell.attrib.get("r", "")
            if not ref:
                continue
            index = column_index(ref)
            max_index = max(max_index, index)
            cell_type = cell.attrib.get("t")
            value_node = cell.find("a:v", ns)
            value = "" if value_node is None or value_node.text is None else value_node.text
            if cell_type == "s" and value != "":
                value = strings[int(value)]
            elif cell_type == "inlineStr":
                value = "".join(text.text or "" for text in cell.findall(".//a:t", ns))
            cells[index] = value
        rows.append([cells.get(i, "") for i in range(max_index + 1)])
    require(rows, "Okanogan workbook did not contain rows.")
    header = [str(item).strip() for item in rows[0]]
    return header, rows[1:]


def row_dict(header, row):
    return {header[i]: row[i] if i < len(row) else "" for i in range(len(header))}


def build_records(header, source_rows, payload_hash, generated_date):
    records = []
    sanitized_rows = []
    for ordinal, row in enumerate(source_rows, start=1):
        data = row_dict(header, row)
        sale_date = excel_date(data.get("SaleDate"))
        sale_price = as_number(data.get("OriginalSalePrice"))
        adjusted_sale_price = as_number(data.get("AdjustedSalePrice"))
        parcel = as_text(data.get("ParcelNumber"))
        if not parcel or not sale_date or sale_price is None:
            continue
        if sale_date > generated_date:
            continue

        document = as_text(data.get("RecordingNumber")) or as_text(data.get("ExciseAffidavit"))
        house_number = as_text(data.get("HouseNumber"))
        street = as_text(data.get("StreetName"))
        address = " ".join(part for part in [house_number, street] if part).strip() or None
        use_code = as_text(data.get("DORCode"))
        neighborhood = as_text(data.get("Neighborhood"))
        current_neighborhood = as_text(data.get("CurrentNeighborhood"))
        acres = as_number(data.get("TotalAcres")) or as_number(data.get("LandAcres"))

        sanitized = {
            "ordinal": ordinal,
            "parcelNumber": parcel,
            "saleDate": sale_date,
            "salePrice": sale_price,
            "adjustedSalePrice": adjusted_sale_price,
            "documentNumber": document,
            "deedType": as_text(data.get("DeedType")),
            "situsAddress": address,
            "situsCity": as_text(data.get("City")),
            "situsZip": as_text(data.get("Zip")),
            "useCode": use_code,
            "acres": acres,
            "neighborhoodCode": neighborhood,
            "currentNeighborhoodCode": current_neighborhood,
            "grossLivingArea": as_number(data.get("ResidentialArea")) or as_number(data.get("CommercialArea")),
            "lotSizeSqft": as_number(data.get("Units")) if as_text(data.get("UnitType")) == "Square Feet" else None,
            "yearBuilt": as_number(data.get("YearBuilt")),
            "bedrooms": as_number(data.get("Bedrooms")),
            "bathrooms": as_number(data.get("Bathrooms")),
            "condition": as_text(data.get("Condition")),
            "qualityGrade": as_text(data.get("Quality")),
            "primaryImprovement": as_text(data.get("PrimaryImprovement")),
            "primaryLandType": as_text(data.get("PrimaryLandType")),
        }
        sanitized_rows.append(sanitized)

        identity = "|".join(str(part or "") for part in [CODE, parcel, document, sale_date, sale_price, use_code, ordinal])
        candidate_source = f"{PAYLOAD}#row:{ordinal}:parcel:{parcel}:document:{document or 'unknown'}"
        records.append(
            {
                "saleId": f"WA-{CODE}-{hashlib.sha256(identity.encode('utf-8')).hexdigest()[:32]}",
                "county": COUNTY,
                "countyCode": CODE,
                "parcelNumber": parcel,
                "saleDate": sale_date,
                "saleYear": int(sale_date[:4]),
                "salePrice": sale_price,
                "adjustedSalePrice": adjusted_sale_price,
                "documentNumber": document,
                "deedType": sanitized["deedType"],
                "situsAddress": address,
                "situsCity": sanitized["situsCity"],
                "situsZip": sanitized["situsZip"],
                "useCode": use_code,
                "acres": acres,
                "grantor": None,
                "grantee": None,
                "saleNote": None,
                "neighborhoodCode": neighborhood,
                "currentNeighborhoodCode": current_neighborhood,
                "sourceMode": MODE,
                "candidateSource": "okanogan-official-real-property-sales-xlsx",
                "confidenceScore": 0.95,
                "qualityScore": 0.95,
                "qualityBand": "official_assessor_sale_xlsx_public_record",
                "reviewStatus": "ready",
                "grossLivingArea": sanitized["grossLivingArea"],
                "lotSizeSqft": sanitized["lotSizeSqft"],
                "yearBuilt": sanitized["yearBuilt"],
                "bedrooms": sanitized["bedrooms"],
                "bathrooms": sanitized["bathrooms"],
                "condition": sanitized["condition"],
                "qualityGrade": sanitized["qualityGrade"],
                "provenance": {
                    "sourceUrl": SOURCE,
                    "sourceFinalUrl": SOURCE_FINAL,
                    "sourcePayloadPath": PAYLOAD,
                    "sourcePayloadSha256": payload_hash,
                    "candidateIndexSource": candidate_source,
                    "candidateRecordType": "official-okanogan-real-property-sales-xlsx-row",
                    "candidateSourceOrdinal": ordinal,
                    "componentRows": [
                        {
                            "sourceKey": "xlsx-row",
                            "sourceUrl": SOURCE,
                            "sourcePayloadPath": PAYLOAD,
                            "sourcePayloadSha256": payload_hash,
                            "candidateIndexSource": candidate_source,
                        }
                    ],
                },
                "flags": {
                    "duplicateRisk": False,
                    "needsReview": False,
                    "futureSaleDate": False,
                    "manualException": False,
                },
            }
        )
    records.sort(key=lambda item: (item["saleDate"], item["saleId"]), reverse=True)
    return records, sanitized_rows


def main():
    generated_at = sys.argv[1] if len(sys.argv) > 1 else datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    root = Path(sys.argv[2] if len(sys.argv) > 2 else DEFAULT_ROOT)
    require(
        re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z", generated_at) is not None,
        "generatedAt must be exact ISO UTC with millisecond precision.",
    )
    generated_date = generated_at[:10]

    data, final_url, content_type = download_xlsx()
    header, source_rows = read_workbook_rows(data)
    require(final_url == SOURCE_FINAL, f"Okanogan source final URL drifted: {final_url}")

    candidate_payload = {
        "source": {
            "url": SOURCE,
            "finalUrl": final_url,
            "contentType": content_type,
            "bytes": len(data),
        },
        "headers": header,
        "rows": [
            {header[i]: row[i] if i < len(row) else "" for i in range(len(header))}
            for row in source_rows
        ],
    }
    raw_candidate_count = len(candidate_payload["rows"])
    # Hash the sanitized, product-authorized row projection rather than party/legal strings.
    provisional_hash = sha({"source": candidate_payload["source"], "headers": header, "rows": raw_candidate_count})
    records, sanitized_rows = build_records(header, source_rows, provisional_hash, generated_date)
    sanitized_payload = {
        "source": candidate_payload["source"],
        "rawWorkbookRows": raw_candidate_count,
        "rows": sanitized_rows,
    }
    payload_hash = sha(sanitized_payload)
    records, sanitized_rows = build_records(header, source_rows, payload_hash, generated_date)
    require(records, "Okanogan produced no stageable records.")
    require(len({record["saleId"] for record in records}) == len(records), "Okanogan sale IDs are not unique.")

    review = 0
    latest = records[0]["saleDate"]
    sales_route = f"/launch-data/washington/sales/by-county/{CODE}.json"
    detail_route = f"/launch-data/washington/counties/{CODE}.json"
    shard = {
        "schemaVersion": "terrafusion.washington.sales-shard.v1",
        "generatedAt": generated_at,
        "county": COUNTY,
        "countyCode": CODE,
        "summary": {
            "records": len(records),
            "latestSaleDate": latest,
            "reviewRecords": review,
            "recordsWithNeighborhoodCode": sum(1 for record in records if record["neighborhoodCode"]),
            "topNeighborhoodCodes": {},
        },
        "records": records,
    }
    detail = {
        "schemaVersion": "terrafusion.washington.county-detail.v1",
        "generatedAt": generated_at,
        "county": COUNTY,
        "countyCode": CODE,
        "operationalState": {
            "primarySourceMode": MODE,
            "prometheusStatus": "public_data_ready",
        },
        "summary": {
            "records": len(records),
            "latestSaleDate": latest,
        },
        "salesRoute": sales_route,
    }
    status_entry = {
        "county": COUNTY,
        "countyCode": CODE,
        "priority": "washington_assessor_launch",
        "prometheusStatus": "public_data_ready",
        "primarySourceMode": MODE,
        "latestSaleDate": latest,
        "candidateSales": len(records),
        "stagedSales": len(records),
        "needsReview": review,
        "confidence": {
            "averageQualityScore": 0.95,
            "parserStatus": "ready",
            "rawStatus": "official_real_property_sales_xlsx_verified",
            "rawDriftDetected": False,
        },
        "staticRoutes": {
            "detail": detail_route,
            "salesShard": sales_route,
        },
    }
    attestation = {
        "algorithm": "SHA-256",
        "canonicalJsonSha256": sha(shard),
        "county": COUNTY,
        "countyCode": CODE,
        "officialSourceBaseUrl": OFFICIAL,
        "route": sales_route,
        "sourcePayloadSha256": [payload_hash],
        "sourcePosture": MODE,
    }

    manifest_path = root / "manifest.json"
    status_path = root / "counties" / "status.json"
    manifest = generated(read_json(manifest_path), generated_at)
    status = generated(read_json(status_path), generated_at)
    kept_attestations = [item for item in manifest["salesShardAttestations"] if item["countyCode"] != CODE]
    kept_status = [item for item in status["counties"] if item["countyCode"] != CODE]
    shards = {CODE: shard}
    for item in kept_attestations:
        sales_path = root / "sales" / "by-county" / f"{item['countyCode']}.json"
        detail_path = root / "counties" / f"{item['countyCode']}.json"
        existing_shard = generated(read_json(sales_path), generated_at)
        existing_detail = generated(read_json(detail_path), generated_at)
        write_json(sales_path, existing_shard)
        write_json(detail_path, existing_detail)
        item["canonicalJsonSha256"] = sha(existing_shard)
        shards[item["countyCode"]] = existing_shard

    status["generatedAt"] = generated_at
    status["sourcePosture"] = "mixed_public_assessor_sources"
    status["counties"] = sorted(kept_status + [status_entry], key=lambda item: item["countyCode"])
    manifest["generatedAt"] = generated_at
    manifest["sourcePosture"] = status["sourcePosture"]
    manifest["statusCanonicalJsonSha256"] = sha(status)
    manifest["salesShardAttestations"] = sorted(kept_attestations + [attestation], key=lambda item: item["countyCode"])
    manifest["summary"] = {
        "counties": len(status["counties"]),
        "rawLanded": len(status["counties"]),
        "parserReady": sum(1 for item in status["counties"] if item.get("confidence", {}).get("parserStatus") == "ready"),
        "candidateSales": sum(item["candidateSales"] for item in status["counties"]),
        "stagedSales": sum(item["stagedSales"] for item in status["counties"]),
        "needsReview": sum(item["needsReview"] for item in status["counties"]),
        "prometheusNeedsReview": sum(1 for item in status["counties"] if item["prometheusStatus"] == "needs_review"),
        "recordsWithNeighborhoodCode": sum(item["summary"]["recordsWithNeighborhoodCode"] for item in shards.values()),
        "futureSaleDateRecords": sum(
            1 for item in shards.values() for record in item["records"] if record.get("flags", {}).get("futureSaleDate") is True
        ),
        "criticalContradictions": 0,
        "garfieldExceptions": 0,
        "bentonCityAsNeighborhoodRecords": 0,
    }

    write_json(root / "sales" / "by-county" / f"{CODE}.json", shard)
    write_json(root / "counties" / f"{CODE}.json", detail)
    write_json(status_path, status)
    write_json(manifest_path, manifest)
    write_json(
        root / "receipts" / "okanogan-source.json",
        {
            "schemaVersion": "terrafusion.washington.public-source-receipt.v1",
            "county": COUNTY,
            "countyCode": CODE,
            "generatedAt": generated_at,
            "sourceUrl": SOURCE,
            "sourceFinalUrl": SOURCE_FINAL,
            "sourcePayloadPath": PAYLOAD,
            "sourcePayloadRecords": raw_candidate_count,
            "sourcePayloadSha256": payload_hash,
            "candidateSales": len(records),
            "stagedSales": len(records),
            "quarantinedSales": raw_candidate_count - len(records),
            "needsReview": review,
            "omittedFields": [
                "owner",
                "grantor",
                "grantee",
                "buyer",
                "seller",
                "legalDescription",
                "parcelDescription",
                "saleNote",
                "reviewNote",
                "geometry",
                "map",
            ],
        },
    )
    print(
        json.dumps(
            {
                "county": COUNTY,
                "countyCode": CODE,
                "sourceFinalUrl": SOURCE_FINAL,
                "sourcePayloadSha256": payload_hash,
                "sourcePayloadRows": raw_candidate_count,
                "candidateRecords": len(records),
                "stagedRecords": len(records),
                "quarantinedRecords": raw_candidate_count - len(records),
                "reviewRecords": review,
                "latestSaleDate": latest,
                "manifestCanonicalJsonSha256": sha(manifest),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
