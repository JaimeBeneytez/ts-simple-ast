﻿import * as ts from "typescript";
import {GlobalContainer} from "./../../GlobalContainer";
import {EnumMember} from "./../enum";
import {Node, Symbol, Signature, Expression} from "./../common";
import {Type} from "./../type";

/**
 * Wrapper around the TypeChecker.
 */
export class TypeChecker {
    /** @internal */
    private readonly global: GlobalContainer;
    /** @internal */
    private _compilerTypeChecker: ts.TypeChecker;

    /**
     * Gets the compiler's TypeChecker.
     */
    get compilerTypeChecker() {
        return this._compilerTypeChecker;
    }

    /** @internal */
    constructor(global: GlobalContainer) {
        this.global = global;
    }

    /**
     * Resets the type checker.
     * @internal
     */
    reset(typeChecker: ts.TypeChecker) {
        this._compilerTypeChecker = typeChecker;
    }

    /**
     * Gets the apparent type of a type.
     * @param type - Type to get the apparent type of.
     */
    getApparentType(type: Type) {
        return this.global.compilerFactory.getType(this.compilerTypeChecker.getApparentType(type.compilerType));
    }

    /**
     * Gets the constant value of a declaration.
     * @param node - Node to get the constant value from.
     */
    getConstantValue(node: EnumMember) {
        return this.compilerTypeChecker.getConstantValue(node.compilerNode);
    }

    /**
     * Gets the fully qualified name of a symbol.
     * @param symbol - Symbol to get the fully qualified name of.
     */
    getFullyQualifiedName(symbol: Symbol) {
        return this.compilerTypeChecker.getFullyQualifiedName(symbol.compilerSymbol);
    }

    /**
     * Gets the type at the specified location.
     * @param node - Node to get the type for.
     */
    getTypeAtLocation(node: Node): Type {
        return this.global.compilerFactory.getType(this.compilerTypeChecker.getTypeAtLocation(node.compilerNode));
    }

    /**
     * Gets the contextual type of an expression.
     * @param expression - Expression.
     */
    getContextualType(expression: Expression): Type | undefined {
        const contextualType = this.compilerTypeChecker.getContextualType(expression.compilerNode);
        return contextualType == null ? undefined : this.global.compilerFactory.getType(contextualType);
    }

    /**
     * Gets the type of a symbol at the specified location.
     * @param symbol - Symbol to get the type for.
     * @param node - Location to get the type for.
     */
    getTypeOfSymbolAtLocation(symbol: Symbol, node: Node): Type {
        return this.global.compilerFactory.getType(this.compilerTypeChecker.getTypeOfSymbolAtLocation(symbol.compilerSymbol, node.compilerNode));
    }

    /**
     * Gets the declared type of a symbol.
     * @param symbol - Symbol to get the type for.
     */
    getDeclaredTypeOfSymbol(symbol: Symbol): Type {
        return this.global.compilerFactory.getType(this.compilerTypeChecker.getDeclaredTypeOfSymbol(symbol.compilerSymbol));
    }

    /**
     * Gets the symbol at the specified location or undefined if none exists.
     * @param node - Node to get the symbol for.
     */
    getSymbolAtLocation(node: Node): Symbol | undefined {
        const compilerSymbol = this.compilerTypeChecker.getSymbolAtLocation(node.compilerNode);
        return compilerSymbol == null ? undefined : this.global.compilerFactory.getSymbol(compilerSymbol);
    }

    /**
     * Gets the aliased symbol of a symbol.
     * @param symbol - Symbol to get the alias symbol of.
     */
    getAliasedSymbol(symbol: Symbol): Symbol | undefined {
        if (!symbol.hasFlags(ts.SymbolFlags.Alias))
            return undefined;

        const tsAliasSymbol = this.compilerTypeChecker.getAliasedSymbol(symbol.compilerSymbol);
        return tsAliasSymbol == null ? undefined : this.global.compilerFactory.getSymbol(tsAliasSymbol);
    }

    /**
     * Gets the properties of a type.
     * @param type - Type.
     */
    getPropertiesOfType(type: Type) {
        return this.compilerTypeChecker.getPropertiesOfType(type.compilerType).map(p => this.global.compilerFactory.getSymbol(p));
    }

    /**
     * Gets the type text
     * @param type - Type to get the text of.
     * @param enclosingNode - Enclosing node.
     * @param typeFormatFlags - Type format flags.
     */
    getTypeText(type: Type, enclosingNode?: Node, typeFormatFlags?: ts.TypeFormatFlags) {
        if (typeFormatFlags == null)
            typeFormatFlags = this.getDefaultTypeFormatFlags(enclosingNode);

        const compilerNode = enclosingNode == null ? undefined : enclosingNode.compilerNode;
        return this.compilerTypeChecker.typeToString(type.compilerType, compilerNode, typeFormatFlags);
    }

    /**
     * Gets the return type of a signature.
     * @param signature - Signature to get the return type of.
     */
    getReturnTypeOfSignature(signature: Signature): Type {
        return this.global.compilerFactory.getType(this.compilerTypeChecker.getReturnTypeOfSignature(signature.compilerSignature));
    }

    /**
     * Gets a signature from a node.
     * @param node - Node to get the signature from.
     */
    getSignatureFromNode(node: Node<ts.SignatureDeclaration>): Signature | undefined {
        const signature = this.compilerTypeChecker.getSignatureFromDeclaration(node.compilerNode);
        return signature == null ? undefined : this.global.compilerFactory.getSignature(signature);
    }

    private getDefaultTypeFormatFlags(enclosingNode?: Node) {
        let formatFlags = (ts.TypeFormatFlags.UseTypeOfFunction | ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseFullyQualifiedType |
            ts.TypeFormatFlags.WriteTypeArgumentsOfSignature) as ts.TypeFormatFlags;

        if (enclosingNode != null && enclosingNode.getKind() === ts.SyntaxKind.TypeAliasDeclaration)
            formatFlags |= ts.TypeFormatFlags.InTypeAlias;

        return formatFlags;
    }
}
