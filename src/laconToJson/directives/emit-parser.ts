/**
 * Обработка директив <emit> в LACON
 */

import { processFunctionsInText } from '../elements/function-parser';

export interface EmitDirective {
    start: number;
    end: number;
    direction: '+' | '-';
    localVar?: string;
    localVarExpr?: string;
    restOfLine: string;
    isHex: boolean; // Был ли START в hex формате
}

/**
 * Парсит директиву <emit>
 * Формат: <emit: START to ±COUNT as local $var=выражение>остаток строки
 * Или: <emit: START to ±COUNT as local $var>остаток строки (без выражения = @current)
 * Остаток строки может быть пустым (ключ на следующей строке)
 */
export function parseEmitDirective(line: string): EmitDirective | null {
    // Удаляем \r и пробелы по краям для корректного парсинга
    const cleaned = line.trim().replace(/\r/g, '');
    
    // Регулярное выражение для <emit: num to ±num as local $var=expr> или <emit: num to ±num as local $var>
    // restOfLine теперь может быть пустым
    const emitRegex = /<emit:\s*(.+?)\s+to\s+([+-])(\d+)(?:\s+as\s+local\s+(\$[\w-]+)(?:\s*=\s*(.+?))?)?>\s*(.*)$/;
    const match = cleaned.match(emitRegex);

    if (!match) {
        return null;
    }

    const [, startStr, direction, countStr, localVar, localVarExpr, restOfLine] = match;

    // Парсим начальное значение (может быть 0x4E3 или обычное число)
    const isHex = startStr.startsWith('0x') || startStr.startsWith('0X');
    let start: number;
    if (isHex) {
        start = parseInt(startStr, 16);
    } else {
        start = parseInt(startStr, 10);
    }

    const count = parseInt(countStr, 10);
    const end = start + count;

    return {
        start,
        end,
        direction: direction as '+' | '-',
        localVar: localVar ? localVar.substring(1) : undefined, // Убираем $
        localVarExpr: localVarExpr || (localVar ? '@current' : undefined), // Если нет выражения, используем @current
        restOfLine,
        isHex
    };
}

/**
 * Форматирует текущее значение в зависимости от формата директивы
 * Для hex возвращает только hex число без префикса (например, "04E3")
 * Для decimal возвращает число (например, "1251")
 */
function formatCurrentValue(value: number, isHex: boolean): string {
    if (isHex) {
        return value.toString(16).toUpperCase().padStart(4, '0');
    }
    return value.toString();
}

/**
 * Раскрывает директиву <emit> в множество строк
 */
export function expandEmitDirective(
    line: string,
    nextLine: string | undefined,
    globalVars: Record<string, string>,
    indentation: string
): { lines: string[], consumedNextLine: boolean } {
    const directive = parseEmitDirective(line);
    if (!directive) {
        return { lines: [line], consumedNextLine: false };
    }

    // Если restOfLine пустой, берём ключ из следующей строки
    let keyTemplate = directive.restOfLine;
    let consumedNextLine = false;
    
    if (!keyTemplate && nextLine !== undefined) {
        const nextTrimmed = nextLine.trim();
        // Проверяем, что следующая строка не пустая и не комментарий
        if (nextTrimmed && !nextTrimmed.startsWith('//') && !nextTrimmed.startsWith('/*')) {
            keyTemplate = nextTrimmed;
            consumedNextLine = true;
        }
    }

    const result: string[] = [];
    const step = directive.direction === '+' ? 1 : -1;
    const iterations = directive.end - directive.start;

    for (let i = 0; i < iterations; i++) {
        const currentValue = directive.start + (i * step);
        
        // Создаём локальную область видимости переменных
        const localVars = { ...globalVars };

        // Если есть локальная переменная, вычисляем её значение
        if (directive.localVar && directive.localVarExpr) {
            let varValue: string;
            
            // Если выражение - просто @current, используем форматированное значение
            if (directive.localVarExpr.trim() === '@current') {
                varValue = formatCurrentValue(currentValue, directive.isHex);
            } else {
                varValue = processFunctionsInText(
                    directive.localVarExpr,
                    localVars,
                    currentValue
                );
            }
            localVars[directive.localVar] = varValue;
        }

        // Обрабатываем ключ, подставляя локальные переменные
        let expandedLine = keyTemplate;
        
        // Подставляем переменные
        expandedLine = expandedLine.replace(/\$(\w[\w-]*)(~?)/g, (match, varName) => {
            return localVars[varName] !== undefined ? localVars[varName] : match;
        });

        // Обрабатываем функции
        expandedLine = processFunctionsInText(expandedLine, localVars, currentValue);

        result.push(indentation + expandedLine);
    }

    return { lines: result, consumedNextLine };
}

/**
 * Обрабатывает блок с emit директивой
 * Раскрывает блок для каждой итерации
 */
export function expandEmitBlock(
    lines: string[],
    startIndex: number,
    globalVars: Record<string, string>
): { expandedLines: string[]; endIndex: number } {
    const firstLine = lines[startIndex];
    const directive = parseEmitDirective(firstLine);
    
    if (!directive) {
        return { expandedLines: [firstLine], endIndex: startIndex };
    }

    // Находим блок (до закрывающей скобки)
    const indentMatch = firstLine.match(/^(\s*)/);
    const baseIndent = indentMatch ? indentMatch[1].length : 0;
    
    let blockStartIndex = startIndex;
    let keyTemplate = directive.restOfLine;
    
    // Если restOfLine пустой, ключ на следующей строке
    if (!keyTemplate && startIndex + 1 < lines.length) {
        const nextLine = lines[startIndex + 1];
        const nextTrimmed = nextLine.trim();
        if (nextTrimmed && !nextTrimmed.startsWith('//') && !nextTrimmed.startsWith('/*')) {
            keyTemplate = nextTrimmed;
            blockStartIndex = startIndex + 1;
        }
    }
    
    let endIndex = blockStartIndex + 1;
    const blockLines: string[] = [];
    
    // Собираем строки блока
    while (endIndex < lines.length) {
        const line = lines[endIndex];
        const lineIndent = line.match(/^(\s*)/)?.[1].length || 0;
        
        // Если нашли закрывающую скобку на том же уровне отступа
        if (line.trim() === '}' && lineIndent === baseIndent) {
            break;
        }
        
        blockLines.push(line);
        endIndex++;
    }

    const result: string[] = [];
    const step = directive.direction === '+' ? 1 : -1;
    const iterations = directive.end - directive.start;

    // Генерируем блок для каждой итерации
    for (let i = 0; i < iterations; i++) {
        const currentValue = directive.start + (i * step);
        
        // Создаём локальную область видимости
        const localVars = { ...globalVars };

        // Вычисляем локальную переменную
        if (directive.localVar && directive.localVarExpr) {
            let varValue: string;
            
            // Если выражение - просто @current, используем форматированное значение
            if (directive.localVarExpr.trim() === '@current') {
                varValue = formatCurrentValue(currentValue, directive.isHex);
            } else {
                varValue = processFunctionsInText(
                    directive.localVarExpr,
                    localVars,
                    currentValue
                );
            }
            localVars[directive.localVar] = varValue;
        }

        // Обрабатываем заголовок блока
        let blockHeader = keyTemplate;
        blockHeader = blockHeader.replace(/\$(\w[\w-]*)(~?)/g, (match, varName) => {
            return localVars[varName] !== undefined ? localVars[varName] : match;
        });
        blockHeader = processFunctionsInText(blockHeader, localVars, currentValue);
        
        const indent = firstLine.match(/^(\s*)/)?.[1] || '';
        result.push(indent + blockHeader);

        // Обрабатываем строки блока
        for (const blockLine of blockLines) {
            let processedLine = blockLine.replace(/\$(\w[\w-]*)(~?)/g, (match, varName) => {
                return localVars[varName] !== undefined ? localVars[varName] : match;
            });
            processedLine = processFunctionsInText(processedLine, localVars, currentValue);
            result.push(processedLine);
        }

        result.push(indent + '}');
    }

    return { expandedLines: result, endIndex };
}