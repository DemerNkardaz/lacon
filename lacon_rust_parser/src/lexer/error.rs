use crate::lexer::position::Position;
use std::fmt;

#[derive(Debug, Clone)]
pub struct LexicalError {
    pub message: String,
    pub position: Position,
    pub error_type: LexicalErrorType,
}

#[derive(Debug, Clone)]
pub enum LexicalErrorType {
    InvalidCharacter(char),
    UnterminatedString,
    UnterminatedBlockComment,
    InvalidIndent,
}

impl fmt::Display for LexicalError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "Lexical Error at {}: {} ({:?})",
            self.position, self.message, self.error_type
        )
    }
}
