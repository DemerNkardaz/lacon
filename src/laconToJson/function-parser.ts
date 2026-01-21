/**
 * Обработка функций в LACON (@f - форматирование)
 */

/**
 * Форматирует значение согласно спецификации
 * @f"текст с {}"(значение) или @f"текст с {:X(offset)}"(значение)
 */
export function formatValue(formatStr: string, value: string | number, vars: Record<string, string>): string {
    // Преобразуем входящее значение в число
    let numValue: number;
    if (typeof value === 'string') {
        if (value.startsWith('0x') || value.startsWith('0X')) {
            numValue = parseInt(value, 16);
        } else {
            numValue = Number(value);
        }
    } else {
        numValue = value;
    }

    // Если не число, возвращаем как строку
    if (isNaN(numValue)) {
        return String(value);
    }

    /**
     * Регулярное выражение:
     * \{                 - начало
     * (:                 - начало группы параметров
     * 0?(\d+)?           - padding (например, 04)
     * ([xX])?            - тип hex
     * (?:\(([^)]+)\))?   - ОПЦИОНАЛЬНО: база в скобках, например (10) или (0x1F031)
     * )?                 - конец группы параметров
     * \}                 - конец
     */
    const regex = /\{(:0?(\d+)?([xX])?(?:\(([^)]+)\))?)?\}/g;

    return formatStr.replace(regex, (match, group1, pad, type, offsetStr) => {
        // Если просто {}, возвращаем значение как есть
        if (!group1) {
            return String(value);
        }

        let finalValue = numValue;

        // Если указан offset (база), прибавляем его к значению
        if (offsetStr) {
            let offset = 0;
            const trimmedOffset = offsetStr.trim();
            if (trimmedOffset.startsWith('0x') || trimmedOffset.startsWith('0X')) {
                offset = parseInt(trimmedOffset, 16);
            } else {
                offset = parseInt(trimmedOffset, 10);
            }
            
            if (!isNaN(offset)) {
                finalValue += offset;
            }
        }

        // Форматирование результата
        let result: string;
        if (type === 'x' || type === 'X') {
            result = finalValue.toString(16);
            if (type === 'X') {
                result = result.toUpperCase();
            }
        } else {
            result = finalValue.toString();
        }

        // Добавляем ведущие нули
        if (pad) {
            result = result.padStart(Number(pad), '0');
        }

        return result;
    });
}

/**
 * Парсит вызов функции @f(формат, значение)
 * Возвращает { format: string, arg: string } или null
 */
export function parseFunctionCall(text: string): { format: string; arg: string } | null {
    // Ищем паттерн @f(аргумент1, аргумент2)
    // Используем нежадное соответствие для первого аргумента, чтобы корректно ловить запятую
    const match = text.match(/@f\((.*?),\s*([^)]+)\)/);
    if (!match) {
        return null;
    }

    return {
        format: match[1],
        arg: match[2].trim()
    };
}

/**
 * Выполняет функцию форматирования в строке
 */
export function executeFunctionCall(
    text: string,
    vars: Record<string, string>,
    currentValue?: number
): string {
    const funcCall = parseFunctionCall(text);
    if (!funcCall) {
        return text;
    }

    // Если аргумент - @current, используем currentValue
    let argValue: string | number = funcCall.arg;
    if (funcCall.arg === '@current' && currentValue !== undefined) {
        argValue = currentValue;
    } else if (funcCall.arg.startsWith('$')) {
        // Подставляем переменную
        const varName = funcCall.arg.substring(1);
        argValue = vars[varName] || funcCall.arg;
    }

    return formatValue(funcCall.format, argValue, vars);
}

/**
 * Обрабатывает все вызовы функций в строке
 */
export function processFunctionsInText(
    text: string,
    vars: Record<string, string>,
    currentValue?: number
): string {
    let result = text;
    // Регулярное выражение для поиска @f(...) с учетом возможной вложенности скобок внутри формата
    const funcRegex = /@f\(.*?, \s*[^)]+\)/g;
    
    result = result.replace(funcRegex, (match) => {
        return executeFunctionCall(match, vars, currentValue);
    });

    return result;
}