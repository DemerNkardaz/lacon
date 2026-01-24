pub mod ast;
pub mod interpreter;
pub mod lexer;
// use crate::interpretator::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Привет, {}! Rust + WASM + VS Code работают сообща.", name)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}
