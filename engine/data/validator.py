"""Report Schema Validator."""

import json
import os

import jsonschema

DEFAULT_SCHEMA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "schemas",
    "recommendations.schema.json",
)


def load_schema(schema_path: str = DEFAULT_SCHEMA_PATH) -> dict:
    """Load JSON Schema Draft 2020-12 file."""
    if not os.path.exists(schema_path):
        raise FileNotFoundError(f"Schema file not found at {schema_path}")
    with open(schema_path, "r", encoding="utf-8") as f:
        return json.load(f)


def validate_report(report_data: dict, schema_path: str = DEFAULT_SCHEMA_PATH) -> tuple[bool, str]:
    """Validate report dict instance against schema. Returns (is_valid, error_message)."""
    schema = load_schema(schema_path)
    try:
        jsonschema.validate(instance=report_data, schema=schema)
        return True, "OK"
    except jsonschema.ValidationError as err:
        return False, str(err.message)
