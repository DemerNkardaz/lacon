import * as fs from 'fs';
import * as path from 'path';

export function laconToJson(text: string, sourcePath?: string): string {
    const currentDir = sourcePath ? path.dirname(sourcePath) : process.cwd();
    const obj = laconToJsonInternal(text, currentDir, new Set());
    return JSON.stringify(obj, null, 2);
}

export function parseLaconFile(filePath: string, importStack: Set<string> = new Set()): any {
    const absolutePath = path.resolve(filePath);

    if (importStack.has(absolutePath)) {
        throw new Error(`Circular import detected: ${absolutePath}`);
    }

    if (!fs.existsSync(absolutePath)) {
        throw new Error(`File not found: ${absolutePath}`);
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
    importStack.add(absolutePath);
    const result = laconToJsonInternal(content, path.dirname(absolutePath), importStack);
    importStack.delete(absolutePath);
    
    return result;
}

function laconToJsonInternal(text: string, currentDir: string, importStack: Set<string>): any {
    const lines = text.split('\n');
    const result: any = {};
    const stack: any[] = [result];
    const indentStack: number[] = [-1];
    const variableRegistry: Record<string, string> = {};
    
    const importRegex = /^@import\s+(?:"([^"]+)"|([^\s"{}|[\]]+))/;

    let isMultiline = false;
    let isRawMultiline = false; 
    let multilineKey = ''; 
    let multilineContent: string[] = [];

    let isArrayMode = false;
    let arrayKey = '';
    let arrayContent: any[] = [];

    const varRegex = /^\s*(?<!\\)\$([\p{L}\d._-]+)\s*=?\s*(.+)$/u;
    const blockStartRegex = /^\s*([\p{L}\d._-]+)\s*(?:>\s*([\p{L}\d._-]+)\s*)?=?\s*\{\s*$/u;
    const multiKeyRegex = /^\s*\[([\p{L}\d\s,.*_-]+)\]\s*=?\s*(.+)$/u;
    const multilineStartRegex = /^\s*([\p{L}\d._-]+)\s*=?\s*(@?\()\s*$/u;
    const arrayStartRegex = /^\s*([\p{L}\d._-]+)\s*=?\s*\[\s*$/u;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const currentLine = line.replace(/\r/g, '');
        const trimmed = currentLine.trim();

        if (!trimmed && !isMultiline) continue;

        if (!isMultiline && !isArrayMode && trimmed.startsWith('@import')) {
            const match = trimmed.match(importRegex);
            if (match) {
                const importPath = match[1] || match[2];
                const fullImportPath = path.resolve(currentDir, importPath);
                const importedData = parseLaconFile(fullImportPath, importStack);
                const currentScope = stack[stack.length - 1];
                Object.assign(currentScope, importedData);
                continue;
            }
        }

        if (isMultiline) {
            if (trimmed === ')') {
                const currentScope = stack[stack.length - 1];
                const finalRawValue = isRawMultiline 
                    ? processRawMultiline(multilineContent) 
                    : processQuotedMultiline(multilineContent);
                
                let resolved = resolveVariables(finalRawValue, variableRegistry);
                const processedValue = unescapeString(resolved);

                if (typeof currentScope[multilineKey] === 'string' && currentScope[multilineKey] !== "") {
                    currentScope[multilineKey] += '\n' + processedValue;
                } else {
                    currentScope[multilineKey] = processedValue;
                }
                
                isMultiline = false;
                multilineContent = [];
                continue;
            }
            multilineContent.push(currentLine);
            continue;
        }

        if (isArrayMode) {
            if (trimmed === ']') {
                const currentScope = stack[stack.length - 1];
                currentScope[arrayKey] = arrayContent;
                isArrayMode = false;
                arrayContent = [];
                continue;
            }
            const cleanItem = trimmed.replace(/\/\/.*$/, '').replace(/,$/, '').trim();
            if (cleanItem) {
                arrayContent.push(parseValue(resolveVariables(cleanItem, variableRegistry), variableRegistry, currentDir, importStack));
            }
            continue;
        }

        const cleanLine = trimmed.replace(/\/\/.*$/, '').trim();
        if (!cleanLine || cleanLine.startsWith('/*')) continue;

        const indentMatch = currentLine.match(/^(\s*)/);
        const currentIndent = indentMatch ? indentMatch[1].length : 0;

        if (cleanLine !== '}') {
            while (stack.length > 1 && currentIndent <= indentStack[indentStack.length - 1]) {
                stack.pop();
                indentStack.pop();
            }
        }

        let currentScope = stack[stack.length - 1];

        if (cleanLine === '}') {
            if (stack.length > 1) {
                stack.pop();
                indentStack.pop();
            }
            continue;
        }

        if (varRegex.test(cleanLine)) {
            const match = cleanLine.match(varRegex)!;
            variableRegistry[match[1]] = unescapeString(unwrapQuotes(match[2].trim()));
            continue; 
        }

        if (arrayStartRegex.test(cleanLine)) {
            const match = cleanLine.match(arrayStartRegex)!;
            arrayKey = match[1];
            isArrayMode = true;
            continue;
        }

        if (multilineStartRegex.test(cleanLine)) {
            const match = cleanLine.match(multilineStartRegex)!;
            multilineKey = match[1];
            isRawMultiline = match[2].startsWith('@');
            isMultiline = true;
            continue;
        }

        if (blockStartRegex.test(cleanLine)) {
            const [, key1, key2] = cleanLine.match(blockStartRegex)!;
            if (key2) {
                ensureObject(currentScope, key1);
                currentScope[key1][key2] = {}; 
                stack.push(currentScope[key1][key2]);
            } else {
                currentScope[key1] = {}; 
                stack.push(currentScope[key1]);
            }
            indentStack.push(currentIndent);
            continue;
        }

        if (multiKeyRegex.test(cleanLine)) {
            const [, keysStr, value] = cleanLine.match(multiKeyRegex)!;
            const keys = keysStr.split(',').map(k => k.trim());
            assignMultiValues(currentScope, keys, value, variableRegistry, currentDir, importStack);
            continue;
        }

        let nextLineIdx = i + 1;
        let nextLine = lines[nextLineIdx];
        while (nextLine !== undefined && !nextLine.trim()) {
            nextLine = lines[++nextLineIdx];
        }

        if (nextLine !== undefined) {
            const nextIndentMatch = nextLine.match(/^(\s*)/);
            const nextIndent = nextIndentMatch ? nextIndentMatch[1].length : 0;
            
            if (nextIndent > currentIndent && !cleanLine.includes('=') && !cleanLine.includes(' ') && !cleanLine.includes('>')) {
                currentScope[cleanLine] = {};
                stack.push(currentScope[cleanLine]);
                indentStack.push(currentIndent);
                continue;
            }
        }

        processComplexLine(cleanLine, currentScope, variableRegistry, currentDir, importStack);
    }

    return result;
}


function parseValue(val: string, vars: Record<string, string>, currentDir: string, importStack: Set<string>): any {
    val = val.trim();

    if (val.startsWith('@import=')) {
        const rawPath = val.substring(8).trim();
        const importPath = unwrapQuotes(rawPath);
        const fullImportPath = path.resolve(currentDir, importPath);
        return parseLaconFile(fullImportPath, importStack);
    }

    if (val.startsWith('"') && val.endsWith('"')) return unescapeString(val.slice(1, -1));
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (val === 'auto') return 'auto';

    if (val.startsWith('{') && val.endsWith('}')) {
        const obj = {}; parseInlinePairs(val.slice(1, -1).trim(), obj, vars, false, currentDir, importStack); return obj;
    }
    
    if (val.startsWith('[') && val.endsWith(']')) {
        const inner = val.slice(1, -1).trim();
        if (!inner) return [];
        const items: string[] = []; let current = "", depth = 0, inQuotes = false;
        for (let i = 0; i < inner.length; i++) {
            const char = inner[i];
            if (char === '"' && inner[i-1] !== '\\') inQuotes = !inQuotes;
            if (!inQuotes) {
                if (char === '[' || char === '{') depth++;
                if (char === ']' || char === '}') depth--;
                if (char === ',' && depth === 0) { items.push(current.trim()); current = ""; continue; }
            }
            current += char;
        }
        items.push(current.trim());
        return items.map(v => parseValue(v, vars, currentDir, importStack));
    }
    if (/^-?\d+(\.\d+)?$/.test(val)) return Number(val);
    return unescapeString(val);
}

function parseInlinePairs(text: string, target: any, vars: Record<string, string>, overwrite: boolean, currentDir: string, importStack: Set<string>) {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    if (trimmedText.endsWith('{}')) {
        const key = trimmedText.replace(/=?\s*\{\}/, '').trim();
        target[key] = {}; return;
    }
    if (trimmedText.endsWith('[]')) {
        const key = trimmedText.replace(/=?\s*\[\]/, '').trim();
        target[key] = []; return;
    }

    if (trimmedText.includes('=')) {
        const keyPositions: any[] = [];
        const findKeysRegex = /(?:^|\s+)(?:([\p{L}\d._-]+)|\[([\p{L}\d\s,.*_-]+)\])\s*=/gu;
        let m;
        while ((m = findKeysRegex.exec(trimmedText)) !== null) {
            if (isBalanced(trimmedText.substring(0, m.index))) {
                keyPositions.push({
                    key: m[1] || m[2],
                    start: m.index + (m[0].indexOf(m[1] || '[' + m[2])),
                    valueStart: m.index + m[0].length,
                    isMulti: !!m[2]
                });
            }
        }
        if (keyPositions.length > 0) {
            const firstKeyStart = keyPositions[0].start;
            const leadText = trimmedText.substring(0, firstKeyStart).trim();
            let currentTarget = target;
            if (leadText) {
                if (overwrite) { target[leadText] = {}; }
                else { ensureObject(target, leadText); }
                currentTarget = target[leadText];
            }
            for (let i = 0; i < keyPositions.length; i++) {
                const cur = keyPositions[i];
                const next = keyPositions[i + 1];
                let rawVal = next ? trimmedText.substring(cur.valueStart, next.start) : trimmedText.substring(cur.valueStart);
                if (cur.isMulti) {
                    assignMultiValues(currentTarget, cur.key.split(',').map((k:any) => k.trim()), rawVal.trim(), vars, currentDir, importStack);
                } else {
                    currentTarget[cur.key] = parseValue(resolveVariables(rawVal.trim(), vars), vars, currentDir, importStack);
                }
            }
            return;
        }
    }

    const firstSpaceIndex = trimmedText.search(/\s/);
    if (firstSpaceIndex === -1) {
        if (!overwrite && typeof target[trimmedText] === 'object' && target[trimmedText] !== null) return;
        target[trimmedText] = true;
    } else {
        const key = trimmedText.substring(0, firstSpaceIndex);
        const value = trimmedText.substring(firstSpaceIndex).trim();
        target[key] = parseValue(resolveVariables(value, vars), vars, currentDir, importStack);
    }
}

function processComplexLine(line: string, scope: any, vars: Record<string, string>, currentDir: string, importStack: Set<string>) {
    let plusIndex = -1;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"' && line[i-1] !== '\\') inQuotes = !inQuotes;
        if (!inQuotes && line[i] === '+') {
            const prefix = line.substring(0, i).trim();
            if (!prefix.includes(' ') || line[i-1] === ' ' || line[i+1] === ' ') {
                plusIndex = i;
                break;
            }
        }
    }

    if (plusIndex !== -1) {
        const keyPath = line.substring(0, plusIndex).trim();
        const valueToAppend = line.substring(plusIndex + 1).trim();
        if (keyPath.includes('>')) {
            const pathParts = keyPath.split('>').map(p => p.trim());
            let current = scope;
            for (let i = 0; i < pathParts.length - 1; i++) {
                ensureObject(current, pathParts[i]);
                current = current[pathParts[i]];
            }
            appendValue(current, pathParts[pathParts.length - 1], valueToAppend, vars, currentDir, importStack);
        } else {
            appendValue(scope, keyPath, valueToAppend, vars, currentDir, importStack);
        }
        return;
    }

    if (line.includes('>')) {
        const parts = line.split('>').map(p => p.trim());
        let current = scope;
        for (let i = 0; i < parts.length - 1; i++) {
            const key = parts[i];
            ensureObject(current, key);
            current = current[key];
        }
        const lastPart = parts[parts.length - 1];
        const isAssignment = !lastPart.endsWith('{}') && !lastPart.endsWith('[]') && (lastPart.includes('=') || lastPart.includes(' '));
        parseInlinePairs(lastPart, current, vars, isAssignment, currentDir, importStack);
        return;
    }
    parseInlinePairs(line, scope, vars, true, currentDir, importStack);
}

function unescapeString(str: string): string {
    if (!str) return str;
    return str.replace(/\\(n|r|t|b|f|"|\\|\$|~|u\{([0-9A-Fa-f]+)\})/g, (match, type, unicodeCode) => {
        if (type.startsWith('u{')) return String.fromCodePoint(parseInt(unicodeCode, 16));
        switch (type) {
            case 'n': return '\n'; case 'r': return '\r'; case 't': return '\t';
            case 'b': return '\b'; case 'f': return '\f'; case '"': return '"';
            case '\\': return '\\'; case '$': return '$'; case '~': return '~';
            default: return match;
        }
    });
}

function ensureObject(parent: any, key: string) {
    if (typeof parent[key] !== 'object' || parent[key] === null || Array.isArray(parent[key])) parent[key] = {};
}

function appendValue(target: any, key: string, value: string, vars: Record<string, string>, currentDir: string, importStack: Set<string>) {
    const resolved = resolveVariables(value, vars);
    const parsed = parseValue(resolved, vars, currentDir, importStack);
    if (!(key in target)) { target[key] = parsed; return; }
    if (Array.isArray(target[key])) { target[key].push(parsed); } 
    else if (typeof target[key] === 'string') {
        const cleanVal = typeof parsed === 'string' ? parsed : String(parsed);
        target[key] = target[key] === "" ? cleanVal : target[key] + '\n' + cleanVal;
    } else { target[key] = parsed; }
}

function assignMultiValues(target: any, keys: string[], rawValue: string, vars: Record<string, string>, currentDir: string, importStack: Set<string>) {
    const resolved = resolveVariables(rawValue, vars);
    const parsed = parseValue(resolved, vars, currentDir, importStack);
    let currentPrefix = "";
    const processedKeys = keys.map((k) => {
        let keyName = k.trim();
        if (keyName.includes('*')) {
            const parts = keyName.split('*');
            currentPrefix = parts[0];
            keyName = currentPrefix + parts[1];
        } else if (currentPrefix) { keyName = currentPrefix + keyName; }
        return keyName;
    });
    if (Array.isArray(parsed) && parsed.length === processedKeys.length) {
        processedKeys.forEach((k, idx) => { target[k] = parsed[idx]; });
    } else {
        processedKeys.forEach(k => { target[k] = parsed; });
    }
}

function isBalanced(text: string): boolean {
    let brackets = 0, braces = 0, inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '"' && text[i-1] !== '\\') inQuotes = !inQuotes;
        if (!inQuotes) {
            if (text[i] === '[') brackets++; if (text[i] === ']') brackets--;
            if (text[i] === '{') braces++; if (text[i] === '}') braces--;
        }
    }
    return brackets === 0 && braces === 0;
}

function processRawMultiline(lines: string[]): string {
    if (lines.length === 0) return "";
    const nonBlankLines = lines.filter(l => l.trim().length > 0);
    if (nonBlankLines.length === 0) return lines.join('\n').trim();
    const minIndent = nonBlankLines.reduce((min, line) => {
        const match = line.match(/^(\s*)/);
        const count = match ? match[1].length : 0;
        return count < min ? count : min;
    }, Infinity);
    const actualMin = minIndent === Infinity ? 0 : minIndent;
    return lines.map(l => (l.length >= actualMin ? l.substring(actualMin) : l.trim())).join('\n').trim();
}

function processQuotedMultiline(lines: string[]): string {
    return lines.filter(l => l.trim().length > 0).map(l => {
        let p = l.trim();
        if (p.endsWith(',')) p = p.slice(0, -1).trim();
        return unwrapQuotes(p);
    }).join('\n');
}

function resolveVariables(value: string, vars: Record<string, string>): string {
    if (!value) return value;
    return value.replace(/(?<!\\)\$([\p{L}\d._-]+)(~?)/gu, (match, varName) => {
        return vars[varName] !== undefined ? vars[varName] : match;
    });
}

function unwrapQuotes(val: string): string {
    if (val.startsWith('"') && val.endsWith('"')) return val.slice(1, -1);
    return val;
}