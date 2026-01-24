use crate::interpretator::functions::format::{FormatFunction, format_function};
use regex::Regex;
use std::collections::HashMap;
use std::sync::LazyLock;

pub static REGEX_STORE: LazyLock<HashMap<&'static str, Regex>> = LazyLock::new(|| {
    let mut map = HashMap::new();

    map.insert("import", Regex::new(r"^@import\s+(.+)$").unwrap());
    map.insert(
        "format",
        Regex::new(r#"^@format\("([^"]*)",\s*(.+)\)$"#).unwrap(),
    );
    map.insert(
        "if_elif_else",
        Regex::new(
            r#"(?s)@if\s*\((?P<if_cond>[^)]+)\)\s*\{(?P<if_body>(?:[^{}]|\{[^{}]*\})*)\}(?:\s*@elif\s*\([^)]+\)\s*\{(?:[^{}]|\{[^{}]*\})*\})*(?:\s*@else\s*\{(?:[^{}]|\{[^{}]*\})*\})?"#
        ).unwrap(),
    );
    map.insert("export", Regex::new(r"^@export\s+(.+)$").unwrap());

    map.insert(
        "export_multiline",
        Regex::new(r"^@export\s*=?\s*(@?\()\s*$").unwrap(),
    );

    map.insert(
        "export_array",
        Regex::new(r"^@export\s*=?\s*\[\s*$").unwrap(),
    );

    map.insert(
        "export_block",
        Regex::new(r"^@export\s*=?\s*\{\s*$").unwrap(),
    );

    map.insert(
        "var",
        Regex::new(r"^\s*(?<!\\)\$([\p{L}\d._-]+)\s*=?\s*(.+)$").unwrap(),
    );

    map.insert(
        "block_start",
        Regex::new(r"^\s*([\p{L}\d._-]+)\s*(?:>\s*([\p{L}\d._-]+)\s*)?=?\s*\{\s*$").unwrap(),
    );

    map.insert(
        "multi_key",
        Regex::new(r"^\s*\[([\p{L}\d\s,.*_-]+)\]\s*=?\s*(.+)$").unwrap(),
    );

    map.insert(
        "multiline_start",
        Regex::new(r"^\s*([\p{L}\d._-]+)\s*=?\s*(@?\()\s*$").unwrap(),
    );

    map.insert(
        "array_start",
        Regex::new(r"^\s*([\p{L}\d._-]+)\s*=?\s*\[\s*$").unwrap(),
    );

    map.insert(
        "import",
        Regex::new(r#"^@import\s+(=)?\s*(?:"([^"]+)"|([^\s"{}|[\]]+))"#).unwrap(),
    );

    map.insert(
        "find_keys",
        Regex::new(r"(?:^|\s+)([\p{L}\d._-]+|\[[\p{L}\d\s,.*_-]+\]|@import(?:\.\.\.)?\s*=)")
            .unwrap(),
    );

    map.insert("number", Regex::new(r"^-?\d+(\.\d+)?$").unwrap());

    map
});

pub static FUNCTION_STORE: LazyLock<HashMap<&'static str, FormatFunction>> = LazyLock::new(|| {
    let mut map: HashMap<&'static str, FormatFunction> = HashMap::new();

    map.insert("format", format_function as FormatFunction);

    map
});
