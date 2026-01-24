// Array type

use crate::interpretator::types::value::Value;

#[derive(Debug, Clone)]
pub struct Array(pub Vec<Value>);
