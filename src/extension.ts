import * as vscode from 'vscode';
import * as l10n from '@vscode/l10n';

export async function activate(context: vscode.ExtensionContext) {
		const locale = vscode.env.language;
    const l10nDir = vscode.Uri.joinPath(context.extensionUri, 'l10n');
    
    let l10nFile = vscode.Uri.joinPath(l10nDir, 'bundle.l10n.json');

    if (locale !== 'en') {
        const specificFile = vscode.Uri.joinPath(l10nDir, `bundle.l10n.${locale}.json`);
        try {
            await vscode.workspace.fs.stat(specificFile);
            l10nFile = specificFile;
        } catch {
            console.log(`Localization for "${locale}" not found, falling back to English.`);
        }
    }

    try {
        await l10n.config({ uri: l10nFile.toString() });
    } catch (e) {
        console.error("Critical error loading l10n:", e);
    }

    const LANG_ID = 'lacon'; 

    const concealDecorationType = vscode.window.createTextEditorDecorationType({
        textDecoration: 'none; display: none;',
        cursor: 'pointer'
    });

    let timeout: NodeJS.Timeout | undefined = undefined;
    let lastSelectionLine: number = -1;
    let lastSelectionChar: number = -1;

    function getCharDetails(char: string, hex: string) {
        const codePoint = char.codePointAt(0) || 0;
        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        md.supportHtml = true;

        let category = "Unknown";
        if (/\p{L}/u.test(char)) category = l10n.t("unicode.category.letter");
        else if (/\p{N}/u.test(char)) category = l10n.t("unicode.category.number");
        else if (/\p{P}/u.test(char)) category = l10n.t("unicode.category.punctuation");
        else if (/\p{S}/u.test(char)) category = l10n.t("unicode.category.symbol");
        else if (/\p{Z}/u.test(char)) category = l10n.t("unicode.category.separator");

        md.appendMarkdown(`${l10n.t("unicode.preview.title")}: U+${hex.toUpperCase()}\n\n---\n\n`);
        md.appendMarkdown(`<span style="font-size:40px;">${char}</span>\n\n`);
        md.appendMarkdown(`| ${l10n.t("unicode.property")} | ${l10n.t("unicode.value")} |\n`);
        md.appendMarkdown(`| :--- | :--- |\n`);
        md.appendMarkdown(`| **${l10n.t("unicode.category")}** | ${category} |\n`);
        md.appendMarkdown(`| **Dec** | ${codePoint} |\n`);
        md.appendMarkdown(`| **UTF-16** | \`\\u${codePoint.toString(16).padStart(4, '0')}\` |\n`);
        md.appendMarkdown(`| **HTML** | \`&#${codePoint};\` |\n`);

        return md;
    }

    function getVarDetails(name: string, value: string, line: number) {
        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        md.appendMarkdown(`${l10n.t("var.title")}$${name}\n\n---\n\n`);
        md.appendMarkdown(`| ${l10n.t("unicode.property")} | ${l10n.t("unicode.value")} |\n`);
        md.appendMarkdown(`| :--- | :--- |\n`);
        md.appendMarkdown(`| **${l10n.t("var.current")}** | \`${value}\` |\n`);
        md.appendMarkdown(`| **${l10n.t("var.defined")}** | ${l10n.t("var.line")} ${line + 1} |\n`);
        return md;
    }

    function updateDecorations() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const text = editor.document.getText();
        const decorations: vscode.DecorationOptions[] = [];
        const selections = editor.selections;

        const activeLines = new Set(selections.map(s => s.active.line));

        const variables = new Map<string, { value: string, line: number }>();
        const declRegEx = /^\$([\p{L}_](?:[\p{L}0-9._-]*[\p{L}0-9_])?)\s+(.+)$/gum;
        let declMatch;
        while ((declMatch = declRegEx.exec(text))) {
            const varName = declMatch[1];
            const varValue = declMatch[2].trim();
            const line = editor.document.positionAt(declMatch.index).line;
            variables.set(varName, { value: varValue, line: line });
        }

        const unicodeRegEx = /\\u\{([0-9a-fA-F]+)\}/g;
        let m;
        let shouldShowHover = false;

        while ((m = unicodeRegEx.exec(text))) {
            const startPos = editor.document.positionAt(m.index);
            const endPos = editor.document.positionAt(m.index + m[0].length);
            const range = new vscode.Range(startPos, endPos);
            
            const isLineActive = activeLines.has(startPos.line);
            
            if (isLineActive) {
                shouldShowHover = true;
            } else {
                try {
                    const char = String.fromCodePoint(parseInt(m[1], 16));
                    decorations.push({
                        range: range,
                        renderOptions: { 
                            before: { 
                                contentText: char, 
                                color: new vscode.ThemeColor('charts.blue'), 
                                fontWeight: 'normal',
                                backgroundColor: 'rgba(0, 122, 204, 0.1)' 
                            } 
                        }
                    });
                } catch (e) {}
            }
        }

        const varUsageRegEx = /\$([\p{L}_](?:[\p{L}0-9._-]*[\p{L}0-9_])?)/gum;
        while ((m = varUsageRegEx.exec(text))) {
            const varName = m[1];
            const startPos = editor.document.positionAt(m.index);
            const endPos = editor.document.positionAt(m.index + m[0].length);
            const range = new vscode.Range(startPos, endPos);
            const varInfo = variables.get(varName);
            
            const isLineActive = activeLines.has(startPos.line);

            if (isLineActive) {
                shouldShowHover = true;
            } else if (varInfo && startPos.line > varInfo.line) {
                decorations.push({
                    range: range,
                    renderOptions: {
                        before: {
                            contentText: varInfo.value,
                            color: new vscode.ThemeColor('symbolIcon.variableForeground'),
                            fontStyle: 'italic',
                            backgroundColor: 'rgba(128, 128, 128, 0.1)'
                        }
                    }
                });
            }
        }

        editor.setDecorations(concealDecorationType, decorations);
        
        if (shouldShowHover) {
            Promise.resolve().then(() => {
                vscode.commands.executeCommand('editor.action.showHover');
            });
        }
    }

    const hoverProvider = vscode.languages.registerHoverProvider(
        { language: LANG_ID, scheme: 'file' },
        {
            provideHover(document, position) {
                const lineText = document.lineAt(position.line).text;
                const unicodeRegEx = /\\u\{([0-9a-fA-F]+)\}/g;
                let m;
                while ((m = unicodeRegEx.exec(lineText)) !== null) {
                    const range = new vscode.Range(position.line, m.index, position.line, m.index + m[0].length);
                    if (range.contains(position)) {
                        return new vscode.Hover(getCharDetails(String.fromCodePoint(parseInt(m[1], 16)), m[1]), range);
                    }
                }

                const varUsageRegEx = /\$([\p{L}_][\p{L}0-9._-]*)/gum;
                const fullText = document.getText();
                const variables = new Map<string, { value: string, line: number }>();
                const declRegEx = /^\$([\p{L}_][\p{L}0-9._-]*)\s+(.+)$/gum;
                let d;
                while ((d = declRegEx.exec(fullText))) {
                    variables.set(d[1], { value: d[2].trim(), line: document.positionAt(d.index).line });
                }

                while ((m = varUsageRegEx.exec(lineText)) !== null) {
                    const range = new vscode.Range(position.line, m.index, position.line, m.index + m[0].length);
                    if (range.contains(position)) {
                        const info = variables.get(m[1]);
                        if (info && position.line > info.line) {
                            return new vscode.Hover(getVarDetails(m[1], info.value, info.line), range);
                        }
                    }
                }
                return null;
            }
        }
    );

    function handleSelectionChange(event: vscode.TextEditorSelectionChangeEvent) {
        triggerUpdate();
    }

    function triggerUpdate() {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(updateDecorations, 50);
    }

    context.subscriptions.push(
        hoverProvider,
        vscode.window.onDidChangeActiveTextEditor(() => triggerUpdate()),
        vscode.workspace.onDidChangeTextDocument(() => triggerUpdate()),
        vscode.window.onDidChangeTextEditorSelection((e) => handleSelectionChange(e))
    );

    triggerUpdate();
}

export function deactivate() {}