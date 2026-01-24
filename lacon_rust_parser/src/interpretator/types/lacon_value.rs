// LaconValue кастомный

use crate::interpretator::types::array::Array;
use crate::interpretator::types::dictionary::Dictionary;
use crate::interpretator::types::string::String;
use crate::interpretator::types::value::Value;

#[derive(Debug, Clone)]
pub enum LaconValue {
    String(String),
    Array(Array),
    Dictionary(Dictionary),
    Value(Value),
}
