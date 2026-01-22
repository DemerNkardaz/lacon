use wasm_bindgen::prelude::*;

// Чтобы функция была доступна в JS/TS, добавляем #[wasm_bindgen]
#[wasm_bindgen]
pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

// Добавим еще одну функцию для работы с текстом (как в первом примере)
#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Привет, {}! Rust + WASM + VS Code работают сообща.", name)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        // Тесты Rust по-прежнему работают через `cargo test`
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}
