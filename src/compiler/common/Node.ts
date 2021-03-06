﻿import * as ts from "typescript";
import * as errors from "./../../errors";
import {GlobalContainer} from "./../../GlobalContainer";
import {replaceNodeText} from "./../../manipulation";
import {Disposable} from "./../../utils";
import {SourceFile} from "./../file";
import * as base from "./../base";
import {ConstructorDeclaration, MethodDeclaration} from "./../class";
import {FunctionDeclaration} from "./../function";
import {TypeAliasDeclaration} from "./../type";
import {InterfaceDeclaration} from "./../interface";
import {NamespaceDeclaration} from "./../namespace";
import {Symbol} from "./Symbol";

export class Node<NodeType extends ts.Node = ts.Node> implements Disposable {
    /** @internal */
    readonly global: GlobalContainer;
    /** @internal */
    private _compilerNode: NodeType | undefined;
    /** @internal */
    sourceFile: SourceFile;

    /**
     * Gets the underlying compiler node.
     */
    get compilerNode(): NodeType {
        if (this._compilerNode == null)
            throw new errors.InvalidOperationError("Attempted to get information from a node that was removed from the AST.");
        return this._compilerNode;
    }

    /**
     * Initializes a new instance.
     * @internal
     * @param global - Global container.
     * @param node - Underlying node.
     * @param sourceFile - Source file for the node.
     */
    constructor(
        global: GlobalContainer,
        node: NodeType,
        sourceFile: SourceFile
    ) {
        this.global = global;
        this._compilerNode = node;
        this.sourceFile = sourceFile;
    }

    /**
     * Releases the node from the cache and ast.
     * @internal
     */
    dispose() {
        for (const child of this.getChildren()) {
            child.dispose();
        }

        this.global.compilerFactory.removeNodeFromCache(this);
        this._compilerNode = undefined;
    }

    /**
     * Sets the source file.
     * @internal
     * @param sourceFile - Source file to set.
     */
    setSourceFile(sourceFile: SourceFile) {
        this.sourceFile = sourceFile;
        for (const child of this.getChildren())
            child.setSourceFile(sourceFile);
    }

    /**
     * Gets the syntax kind.
     */
    getKind() {
        return this.compilerNode.kind;
    }

    /**
     * Gets the syntax kind name.
     */
    getKindName() {
        return ts.SyntaxKind[this.compilerNode.kind];
    }

    /**
     * Gets the compiler symbol.
     */
    getSymbol(): Symbol | undefined {
        const boundSymbol = (this.compilerNode as any).symbol as ts.Symbol | undefined;
        if (boundSymbol != null)
            return this.global.compilerFactory.getSymbol(boundSymbol);

        const typeChecker = this.global.typeChecker;
        const typeCheckerSymbol = typeChecker.getSymbolAtLocation(this);
        if (typeCheckerSymbol != null)
            return typeCheckerSymbol;

        const nameNode = (this.compilerNode as any).name as ts.Node | undefined;
        if (nameNode != null)
            return this.global.compilerFactory.getNodeFromCompilerNode(nameNode, this.sourceFile).getSymbol();

        return undefined;
    }

    /**
     * If the node contains the provided range (inclusive).
     * @param pos - Start position.
     * @param end - End position.
     */
    containsRange(pos: number, end: number) {
        return this.getPos() <= pos && end <= this.getEnd();
    }

    /**
     * Gets the first child by syntax kind or throws an error if not found.
     * @param kind - Syntax kind.
     */
    getFirstChildByKindOrThrow(kind: ts.SyntaxKind) {
        const firstChild = this.getFirstChildByKind(kind);
        if (firstChild == null)
            throw new errors.InvalidOperationError(`A child of the kind ${ts.SyntaxKind[kind]} was expected.`);
        return firstChild;
    }

    /**
     * Gets the first child by syntax kind.
     * @param kind - Syntax kind.
     */
    getFirstChildByKind(kind: ts.SyntaxKind) {
        return this.getFirstChild(child => child.getKind() === kind);
    }

    /**
     * Gets the first child if it matches the specified syntax kind.
     * @param kind - Syntax kind.
     */
    getFirstChildIfKind(kind: ts.SyntaxKind) {
        const firstChild = this.getFirstChild();
        return firstChild != null && firstChild.getKind() === kind ? firstChild : undefined;
    }

    /**
     * Gets the first child by a condition.
     * @param condition - Condition.
     */
    getFirstChild(condition?: (node: Node) => boolean) {
        for (const child of this.getChildren()) {
            if (condition == null || condition(child))
                return child;
        }
        return undefined;
    }

    /**
     * Gets the last child by syntax kind or throws an error if not found.
     * @param kind - Syntax kind.
     */
    getLastChildByKindOrThrow(kind: ts.SyntaxKind) {
        const lastChild = this.getLastChildByKind(kind);
        if (lastChild == null)
            throw new errors.InvalidOperationError(`A child of the kind ${ts.SyntaxKind[kind]} was expected.`);
        return lastChild;
    }

    /**
     * Gets the last child by syntax kind.
     * @param kind - Syntax kind.
     */
    getLastChildByKind(kind: ts.SyntaxKind) {
        return this.getLastChild(child => child.getKind() === kind);
    }

    /**
     * Gets the last child if it matches the specified syntax kind.
     * @param kind - Syntax kind.
     */
    getLastChildIfKind(kind: ts.SyntaxKind) {
        const lastChild = this.getLastChild();
        return lastChild != null && lastChild.getKind() === kind ? lastChild : undefined;
    }

    /**
     * Gets the last child by a condition.
     * @param condition - Condition.
     */
    getLastChild(condition?: (node: Node) => boolean) {
        for (const child of this.getChildren().reverse()) {
            if (condition == null || condition(child))
                return child;
        }
        return undefined;
    }

    /**
     * Offset this node's positions (pos and end) and all of its children by the given offset.
     * @internal
     * @param offset - Offset.
     */
    offsetPositions(offset: number) {
        this.compilerNode.pos += offset;
        this.compilerNode.end += offset;

        for (const child of this.getChildren()) {
            child.offsetPositions(offset);
        }
    }

    /**
     * Gets the previous sibling if it matches the specified kind.
     * @param kind - Kind to check.
     */
    getPreviousSiblingIfKind(kind: ts.SyntaxKind) {
        const previousSibling = this.getPreviousSibling();
        return previousSibling != null && previousSibling.getKind() === kind ? previousSibling : undefined;
    }

    /**
     * Gets the next sibling if it matches the specified kind.
     * @param kind - Kind to check.
     */
    getNextSiblingIfKind(kind: ts.SyntaxKind) {
        const nextSibling = this.getNextSibling();
        return nextSibling != null && nextSibling.getKind() === kind ? nextSibling : undefined;
    }

    getPreviousSibling() {
        let previousSibling: Node | undefined;

        for (const sibling of this.getSiblingsBefore()) {
            previousSibling = sibling;
        }

        return previousSibling;
    }

    getNextSibling() {
        const nextResult = this.getSiblingsAfter().next();
        return nextResult.done ? undefined : nextResult.value;
    }

    *getSiblingsBefore() {
        const parent = this.getParentSyntaxList() || this.getParentOrThrow();

        for (const child of parent.getChildrenIterator()) {
            if (child === this)
                return;

            yield child;
        }
    }

    *getSiblingsAfter() {
        // todo: optimize
        let foundChild = false;
        const parent = this.getParentSyntaxList() || this.getParentOrThrow();

        for (const child of parent.getChildrenIterator()) {
            if (!foundChild) {
                foundChild = child === this;
                continue;
            }

            yield child;
        }
    }

    getChildren(): Node[] {
        return this.compilerNode.getChildren().map(n => this.global.compilerFactory.getNodeFromCompilerNode(n, this.sourceFile));
    }

    /**
     * @internal
     */
    *getChildrenIterator(): IterableIterator<Node> {
        for (const compilerChild of this.compilerNode.getChildren(this.sourceFile.compilerNode)) {
            yield this.global.compilerFactory.getNodeFromCompilerNode(compilerChild, this.sourceFile);
        }
    }

    /**
     * Gets the child syntax list or throws if it doesn't exist.
     */
    getChildSyntaxListOrThrow() {
        const syntaxList = this.getChildSyntaxList();
        if (syntaxList == null)
            throw new errors.InvalidOperationError("A child syntax list was expected.");
        return syntaxList;
    }

    /**
     * Gets the child syntax list if it exists.
     */
    getChildSyntaxList(): Node | undefined {
        let node: Node = this;
        if (node.isBodyableNode() || node.isBodiedNode()) {
            do {
                node = node.isBodyableNode() ? node.getBodyOrThrow() : node.getBody();
            } while ((node.isBodyableNode() || node.isBodiedNode()) && (node.compilerNode as ts.Block).statements == null);
        }

        if (node.isSourceFile() || this.isBodyableNode() || this.isBodiedNode())
            return node.getFirstChildByKind(ts.SyntaxKind.SyntaxList);

        let passedBrace = false;
        for (const child of node.getChildrenIterator()) {
            if (!passedBrace)
                passedBrace = child.getKind() === ts.SyntaxKind.FirstPunctuation;
            else if (child.getKind() === ts.SyntaxKind.SyntaxList)
                return child;
        }

        return undefined;
    }

    /**
     * Gets the children based on a kind.
     * @param kind - Syntax kind.
     */
    getChildrenOfKind<T extends Node = Node>(kind: ts.SyntaxKind) {
        return this.getChildren().filter(c => c.getKind() === kind) as T[];
    }

    *getAllChildren(): IterableIterator<Node> {
        for (const compilerChild of this.compilerNode.getChildren(this.sourceFile.compilerNode)) {
            const child = this.global.compilerFactory.getNodeFromCompilerNode(compilerChild, this.sourceFile);
            yield child;

            for (const childChild of child.getAllChildren())
                yield childChild;
        }
    }

    /**
     * Gets the child count.
     */
    getChildCount() {
        return this.compilerNode.getChildCount(this.sourceFile.compilerNode);
    }

    /**
     * Gets the start position with leading trivia.
     */
    getPos() {
        return this.compilerNode.pos;
    }

    /**
     * Gets the end position.
     */
    getEnd() {
        return this.compilerNode.end;
    }

    /**
     * Gets the start without trivia.
     */
    getStart() {
        return this.compilerNode.getStart(this.sourceFile.compilerNode);
    }

    /**
     * Gets the width of the node (length without trivia).
     */
    getWidth() {
        return this.compilerNode.getWidth(this.sourceFile.compilerNode);
    }

    /**
     * Gets the full width of the node (length with trivia).
     */
    getFullWidth() {
        return this.compilerNode.getFullWidth();
    }

    /**
     * Gets the text without leading trivia.
     */
    getText() {
        return this.compilerNode.getText(this.sourceFile.compilerNode);
    }

    /**
     * Gets the full text with leading trivia.
     */
    getFullText() {
        return this.compilerNode.getFullText(this.sourceFile.compilerNode);
    }

    /**
     * Gets the combined modifier flags.
     */
    getCombinedModifierFlags() {
        return ts.getCombinedModifierFlags(this.compilerNode);
    }

    /**
     * @internal
     */
    replaceCompilerNode(compilerNode: NodeType) {
        this._compilerNode = compilerNode;
    }

    /**
     * Gets the source file.
     */
    getSourceFile(): SourceFile {
        return this.sourceFile;
    }

    /**
     * Goes up the tree yielding all the parents in order.
     */
    *getParents() {
        let parent = (this as Node).getParent();
        while (parent != null) {
            yield parent;
            parent = parent!.getParent();
        }
    }

    /**
     * Get the node's parent.
     */
    getParent() {
        return (this.compilerNode.parent == null) ? undefined : this.global.compilerFactory.getNodeFromCompilerNode(this.compilerNode.parent, this.sourceFile);
    }

    /**
     * Gets the parent or throws an error if it doesn't exist.
     */
    getParentOrThrow() {
        const parentNode = this.getParent();
        if (parentNode == null)
            throw new errors.InvalidOperationError("A parent is required to do this operation.");
        return parentNode;
    }

    /**
     * Gets the first parent by syntax kind or throws if not found.
     * @param kind - Syntax kind.
     */
    getFirstParentByKindOrThrow(kind: ts.SyntaxKind) {
        const parentNode = this.getFirstParentByKind(kind);
        if (parentNode == null)
            throw new errors.InvalidOperationError(`A parent of kind ${ts.SyntaxKind[kind]} is required to do this operation.`);
        return parentNode;
    }

    /**
     * Get the first parent by syntax kind.
     * @param kind - Syntax kind.
     */
    getFirstParentByKind(kind: ts.SyntaxKind) {
        for (const parent of this.getParents()) {
            if (parent.getKind() === kind)
                return parent;
        }
        return undefined;
    }

    /**
     * @internal
     */
    appendNewLineSeparatorIfNecessary() {
        // todo: consider removing this method
        const text = this.getFullText();
        if (this.isSourceFile()) {
            const hasText = text.length > 0;
            if (hasText)
                this.ensureLastChildNewLine();
        }
        else
            this.ensureLastChildNewLine();
    }

    /**
     * @internal
     */
    ensureLastChildNewLine() {
        // todo: consider removing this method
        if (!this.isLastChildTextNewLine())
            this.appendChildNewLine();
    }

    /**
     * @internal
     */
    isLastChildTextNewLine(): boolean {
        // todo: consider removing this method
        const text = this.getFullText();
        /* istanbul ignore else */
        if (this.isSourceFile())
            return text.endsWith("\n");
        else if (this.isBodyableNode() || this.isBodiedNode()) {
            const body = this.isBodyableNode() ? this.getBodyOrThrow() : this.getBody();
            const bodyText = body.getFullText();
            return /\n\s*\}$/.test(bodyText);
        }
        else
            throw errors.getNotImplementedForSyntaxKindError(this.getKind());
    }

    /**
     * @internal
     */
    appendChildNewLine() {
        // todo: consider removing this method
        const newLineText = this.global.manipulationSettings.getNewLineKind();
        if (this.isSourceFile()) {
            this.sourceFile.compilerNode.text += newLineText;
            this.sourceFile.compilerNode.end += newLineText.length;
        }
        else {
            const indentationText = this.getIndentationText();
            const lastToken = this.getLastToken();
            const lastTokenPos = lastToken.getStart();
            replaceNodeText(this.sourceFile, lastTokenPos, lastTokenPos, newLineText + indentationText);
        }
    }

    /**
     * Gets the last token of this node. Usually this is a close brace.
     */
    getLastToken() {
        const lastToken = this.compilerNode.getLastToken(this.sourceFile.compilerNode);
        /* istanbul ignore if */
        if (lastToken == null)
            throw new errors.NotImplementedError("Not implemented scenario where the last token does not exist");

        return this.global.compilerFactory.getNodeFromCompilerNode(lastToken, this.sourceFile);
    }

    /**
     * Gets if this node is in a syntax list.
     */
    isInSyntaxList() {
        return this.getParentSyntaxList() != null;
    }

    /**
     * Gets the parent if it's a syntax list or throws an error otherwise.
     */
    getParentSyntaxListOrThrow() {
        const parentSyntaxList = this.getParentSyntaxList();
        if (parentSyntaxList == null)
            throw new errors.InvalidOperationError("The parent must be a SyntaxList in order to get the required parent syntax list.");
        return parentSyntaxList;
    }

    /**
     * Gets the parent if it's a syntax list.
     */
    getParentSyntaxList() {
        const parent = this.getParent();
        if (parent == null)
            return undefined;

        const pos = this.getPos();
        const end = this.getEnd();
        for (const child of parent.getChildren()) {
            if (child.getPos() > pos || child === this)
                return undefined;

            if (child.getKind() === ts.SyntaxKind.SyntaxList && child.getPos() <= pos && child.getEnd() >= end)
                return child;
        }

        return undefined; // shouldn't happen
    }

    /**
     * Gets the child index of this node relative to the parent.
     */
    getChildIndex() {
        const parent = this.getParentSyntaxList() || this.getParentOrThrow();
        let i = 0;
        for (const child of parent.getChildren()) {
            if (child === this)
                return i;
            i++;
        }

        /* istanbul ignore next */
        throw new errors.NotImplementedError("For some reason the child's parent did not contain the child.");
    }

    /**
     * Gets if the current node is a source file.
     * @internal
     */
    isSourceFile(): this is SourceFile {
        return this.compilerNode.kind === ts.SyntaxKind.SourceFile;
    }

    /**
     * Gets if the current node is a constructor declaration.
     * @internal
     */
    isConstructorDeclaration(): this is ConstructorDeclaration {
        return this.compilerNode.kind === ts.SyntaxKind.Constructor;
    }

    /**
     * Gets if the current node is a function declaration.
     * @internal
     */
    isFunctionDeclaration(): this is FunctionDeclaration {
        return this.compilerNode.kind === ts.SyntaxKind.FunctionDeclaration;
    }

    /**
     * Gets if the current node is an interface declaration.
     * @internal
     */
    isInterfaceDeclaration(): this is InterfaceDeclaration {
        return this.compilerNode.kind === ts.SyntaxKind.InterfaceDeclaration;
    }

    /**
     * Gets if the current node is a namespace declaration.
     * @internal
     */
    isNamespaceDeclaration(): this is NamespaceDeclaration {
        return this.compilerNode.kind === ts.SyntaxKind.ModuleDeclaration;
    }

    /**
     * Gets if the current node is a type alias declaration.
     * @internal
     */
    isTypeAliasDeclaration(): this is TypeAliasDeclaration {
        return this.compilerNode.kind === ts.SyntaxKind.TypeAliasDeclaration;
    }

    /**
     * Gets if the current node is a modifierable node.
     * @internal
     */
    isModifierableNode(): this is base.ModifierableNode {
        return (this as any)[nameof<base.ModifierableNode>(n => n.addModifier)] != null;
    }

    /**
     * Gets if the current node is a method declaration.
     * @internal
     */
    isMethodDeclaration(): this is MethodDeclaration {
        return this.compilerNode.kind === ts.SyntaxKind.MethodDeclaration;
    }

    /* Mixin type guards (overridden in mixins to set to true) */

    /**
     * Gets if this is a bodied node.
     */
    isBodiedNode(): this is base.BodiedNode {
        return false;
    }

    /**
     * Gets if this is a bodyable node.
     */
    isBodyableNode(): this is base.BodyableNode {
        return false;
    }

    /**
     * Gets if this is an initializer expressionable node.
     */
    isInitializerExpressionableNode(): this is base.InitializerExpressionableNode {
        return false;
    }

    /* End mixin type guards */

    /**
     * Gets the indentation text.
     */
    getIndentationText() {
        const sourceFileText = this.sourceFile.getFullText();
        const startLinePos = this.getStartLinePos();
        const startPos = this.getStart();
        let text = "";

        for (let i = startPos - 1; i >= startLinePos; i--) {
            const currentChar = sourceFileText[i];
            switch (currentChar) {
                case " ":
                case "\t":
                    text = currentChar + text;
                    break;
                case "\n":
                    return text;
                default:
                    text = "";
            }
        }

        return text;
    }

    /**
     * Gets the next indentation level text.
     */
    getChildIndentationText() {
        if (this.isSourceFile())
            return "";

        return this.getIndentationText() + this.global.manipulationSettings.getIndentationText();
    }

    /**
     * Gets the position of the start of the line that this node is on.
     */
    getStartLinePos() {
        const sourceFileText = this.sourceFile.getFullText();
        const startPos = this.getStart();

        for (let i = startPos - 1; i >= 0; i--) {
            const currentChar = sourceFileText.substr(i, 1);
            if (currentChar === "\n")
                return i + 1;
        }

        return 0;
    }
}
