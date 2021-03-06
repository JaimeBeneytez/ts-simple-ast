﻿import * as ts from "typescript";
import * as errors from "./../../errors";
import {insertCreatingSyntaxList, insertIntoSyntaxList, replaceStraight, getEndIndexFromArray, insertIntoBracesOrSourceFileWithFillAndGetChildren} from "./../../manipulation";
import * as fillClassFuncs from "./../../manipulation/fillClassFunctions";
import {PropertyDeclarationStructure, MethodDeclarationStructure, ConstructorDeclarationStructure} from "./../../structures";
import {Node} from "./../common";
import {NamedNode, ExportableNode, ModifierableNode, AmbientableNode, DocumentationableNode, TypeParameteredNode, DecoratableNode, HeritageClauseableNode,
    ImplementsClauseableNode} from "./../base";
import {AbstractableNode} from "./base";
import {SourceFile} from "./../file";
import {ParameterDeclaration} from "./../function";
import {ExpressionWithTypeArguments} from "./../type";
import {NamespaceChildableNode} from "./../namespace";
import {ConstructorDeclaration} from "./ConstructorDeclaration";
import {MethodDeclaration} from "./MethodDeclaration";
import {PropertyDeclaration} from "./PropertyDeclaration";
import {GetAccessorDeclaration} from "./GetAccessorDeclaration";
import {SetAccessorDeclaration} from "./SetAccessorDeclaration";

export type ClassInstancePropertyTypes = PropertyDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | ParameterDeclaration;
export type ClassInstanceMemberTypes = MethodDeclaration | ClassInstancePropertyTypes;
export type ClassStaticPropertyTypes = PropertyDeclaration | GetAccessorDeclaration | SetAccessorDeclaration;
export type ClassStaticMemberTypes = MethodDeclaration | ClassStaticPropertyTypes;
export type ClassMemberTypes = MethodDeclaration | PropertyDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | ConstructorDeclaration | ParameterDeclaration;

export const ClassDeclarationBase = ImplementsClauseableNode(HeritageClauseableNode(DecoratableNode(TypeParameteredNode(
    NamespaceChildableNode(DocumentationableNode(AmbientableNode(AbstractableNode(ExportableNode(ModifierableNode(NamedNode(Node)))))))
))));
export class ClassDeclaration extends ClassDeclarationBase<ts.ClassDeclaration> {
    /**
     * Sets the extends expression.
     * @param text - Text to set as the extends expression.
     */
    setExtends(text: string) {
        errors.throwIfNotStringOrWhitespace(text, nameof(text));

        const heritageClauses = this.getHeritageClauses();
        const extendsClause = heritageClauses.find(c => c.compilerNode.token === ts.SyntaxKind.ExtendsKeyword);
        if (extendsClause != null) {
            const extendsClauseStart = extendsClause.getStart();
            replaceStraight(this.getSourceFile(), extendsClauseStart, extendsClause.getEnd() - extendsClauseStart, `extends ${text}`);
            return this;
        }

        const implementsClause = heritageClauses.find(c => c.compilerNode.token === ts.SyntaxKind.ImplementsKeyword);
        let insertPos: number;
        if (implementsClause != null)
            insertPos = implementsClause.getStart();
        else
            insertPos = this.getFirstChildByKindOrThrow(ts.SyntaxKind.OpenBraceToken).getStart();

        const isLastSpace = /\s/.test(this.getSourceFile().getFullText()[insertPos - 1]);
        let insertText = `extends ${text} `;
        if (!isLastSpace)
            insertText = " " + insertText;

        if (implementsClause == null)
            insertCreatingSyntaxList(this.getSourceFile(), insertPos, insertText);
        else
            insertIntoSyntaxList(this.getSourceFile(), insertPos, insertText, implementsClause.getParentSyntaxListOrThrow(), 0, 1);

        return this;
    }

    /**
     * Gets the extends expression.
     */
    getExtends(): ExpressionWithTypeArguments | undefined {
        const heritageClauses = this.getHeritageClauses();
        const extendsClause = heritageClauses.find(c => c.compilerNode.token === ts.SyntaxKind.ExtendsKeyword);
        if (extendsClause == null)
            return undefined;

        const types = extendsClause.getTypes();
        return types.length === 0 ? undefined : types[0];
    }

    /**
     * Adds a constructor. Will remove the previous constructor if it exists.
     * @param structure - Structure of the constructor.
     */
    addConstructor(structure: ConstructorDeclarationStructure = {}) {
        return this.insertConstructor(getEndIndexFromArray(this.compilerNode.members), structure);
    }

    /**
     * Inserts a constructor. Will remove the previous constructor if it exists.
     * @param index - Index to insert at.
     * @param structure - Structure of the constructor.
     */
    insertConstructor(index: number, structure: ConstructorDeclarationStructure = {}) {
        for (const c of this.getConstructors()) {
            c.remove();
        }

        const indentationText = this.getChildIndentationText();
        const newLineChar = this.global.manipulationSettings.getNewLineKind();
        const code = `${indentationText}constructor() {${newLineChar}${indentationText}}`;

        return insertIntoBracesOrSourceFileWithFillAndGetChildren<ConstructorDeclaration, ConstructorDeclarationStructure>({
            getChildren: () => this.getAllMembers(),
            sourceFile: this.getSourceFile(),
            parent: this,
            index,
            childCodes: [code],
            structures: [structure],
            previousBlanklineWhen: () => true,
            nextBlanklineWhen: () => true,
            expectedKind: ts.SyntaxKind.Constructor,
            fillFunction: fillClassFuncs.fillConstructorDeclarationFromStructure
        })[0];
    }

    /**
     * Gets the constructor declarations.
     */
    getConstructors() {
        return this.getAllMembers().filter(m => m.isConstructorDeclaration()) as ConstructorDeclaration[];
    }

    /**
     * Add property.
     * @param structure - Structure representing the property.
     */
    addProperty(structure: PropertyDeclarationStructure) {
        return this.addProperties([structure])[0];
    }

    /**
     * Add properties.
     * @param structures - Structures representing the properties.
     */
    addProperties(structures: PropertyDeclarationStructure[]) {
        return this.insertProperties(getEndIndexFromArray(this.compilerNode.members), structures);
    }

    /**
     * Insert property.
     * @param index - Index to insert at.
     * @param structure - Structure representing the property.
     */
    insertProperty(index: number, structure: PropertyDeclarationStructure) {
        return this.insertProperties(index, [structure])[0];
    }

    /**
     * Insert properties.
     * @param index - Index to insert at.
     * @param structures - Structures representing the properties.
     */
    insertProperties(index: number, structures: PropertyDeclarationStructure[]) {
        const indentationText = this.getChildIndentationText();

        // create code
        const codes: string[] = [];
        for (const structure of structures) {
            let code = `${indentationText}`;
            if (structure.isStatic)
                code += "static ";
            code += structure.name;
            if (structure.hasQuestionToken)
                code += "?";
            if (structure.type != null && structure.type.length > 0)
                code += `: ${structure.type}`;
            code += ";";
            codes.push(code);
        }

        return insertIntoBracesOrSourceFileWithFillAndGetChildren<PropertyDeclaration, PropertyDeclarationStructure>({
            getChildren: () => this.getAllMembers(),
            sourceFile: this.getSourceFile(),
            parent: this,
            index,
            childCodes: codes,
            structures,
            previousBlanklineWhen: n => n.isBodyableNode() || n.isBodiedNode(),
            nextBlanklineWhen: n => n.isBodyableNode() || n.isBodiedNode(),
            expectedKind: ts.SyntaxKind.PropertyDeclaration,
            fillFunction: fillClassFuncs.fillPropertyDeclarationFromStructure
        });
    }

    /**
     * Gets the class instance property declarations.
     */
    getInstanceProperties(): ClassInstancePropertyTypes[] {
        return this.getInstanceMembers()
            .filter(m => isClassPropertyType(m)) as ClassInstancePropertyTypes[];
    }

    /**
     * Gets the class instance property declarations.
     */
    getStaticProperties(): ClassStaticPropertyTypes[] {
        return this.getStaticMembers()
            .filter(m => isClassPropertyType(m)) as ClassStaticPropertyTypes[];
    }

    /**
     * Add method.
     * @param structure - Structure representing the method.
     */
    addMethod(structure: MethodDeclarationStructure) {
        return this.addMethods([structure])[0];
    }

    /**
     * Add methods.
     * @param structures - Structures representing the methods.
     */
    addMethods(structures: MethodDeclarationStructure[]) {
        return this.insertMethods(getEndIndexFromArray(this.compilerNode.members), structures);
    }

    /**
     * Insert method.
     * @param index - Index to insert at.
     * @param structure - Structure representing the method.
     */
    insertMethod(index: number, structure: MethodDeclarationStructure) {
        return this.insertMethods(index, [structure])[0];
    }

    /**
     * Insert methods.
     * @param index - Index to insert at.
     * @param structures - Structures representing the methods.
     */
    insertMethods(index: number, structures: MethodDeclarationStructure[]) {
        const indentationText = this.getChildIndentationText();
        const newLineChar = this.global.manipulationSettings.getNewLineKind();

        // create code
        const codes: string[] = [];
        for (const structure of structures) {
            let code = indentationText;
            if (structure.isStatic)
                code += "static ";
            code += `${structure.name}()`;
            if (structure.returnType != null && structure.returnType.length > 0)
                code += `: ${structure.returnType}`;
            code += ` {` + newLineChar;
            code += indentationText + `}`;
            codes.push(code);
        }

        // insert, fill, and get created nodes
        return insertIntoBracesOrSourceFileWithFillAndGetChildren<MethodDeclaration, MethodDeclarationStructure>({
            getChildren: () => this.getAllMembers(),
            sourceFile: this.getSourceFile(),
            parent: this,
            index,
            childCodes: codes,
            structures,
            previousBlanklineWhen: () => true,
            nextBlanklineWhen: () => true,
            separatorNewlineWhen: () => true,
            expectedKind: ts.SyntaxKind.MethodDeclaration,
            fillFunction: fillClassFuncs.fillMethodDeclarationFromStructure
        });
    }

    /**
     * Gets the class instance method declarations.
     */
    getInstanceMethods(): MethodDeclaration[] {
        return this.getInstanceMembers().filter(m => m instanceof MethodDeclaration) as MethodDeclaration[];
    }

    /**
     * Gets the class instance method declarations.
     */
    getStaticMethods(): MethodDeclaration[] {
        return this.getStaticMembers().filter(m => m instanceof MethodDeclaration) as MethodDeclaration[];
    }

    /**
     * Gets the instance members.
     */
    getInstanceMembers() {
        return this.getAllMembers().filter(m => !m.isConstructorDeclaration() && (m instanceof ParameterDeclaration || !m.isStatic())) as ClassInstanceMemberTypes[];
    }

    /**
     * Gets the static members.
     */
    getStaticMembers() {
        return this.getAllMembers().filter(m => !m.isConstructorDeclaration() && !(m instanceof ParameterDeclaration) && m.isStatic()) as ClassStaticMemberTypes[];
    }

    /**
     * Gets the constructors, methods, properties, and class parameter properties.
     */
    getAllMembers() {
        const members = this.compilerNode.members.map(m => this.global.compilerFactory.getNodeFromCompilerNode(m, this.sourceFile)) as ClassMemberTypes[];
        const ctors = members.filter(c => c.isConstructorDeclaration() && c.getBody() != null) as ConstructorDeclaration[];
        for (const ctor of ctors) {
            // insert after the constructor
            let insertIndex = members.indexOf(ctor) + 1;
            for (const param of ctor.getParameters()) {
                if (param.isParameterProperty()) {
                    members.splice(insertIndex, 0, param);
                    insertIndex++;
                }
            }
        }
        return members;
    }
}

function isClassPropertyType(m: Node) {
    return m instanceof PropertyDeclaration || m instanceof SetAccessorDeclaration || m instanceof GetAccessorDeclaration || m instanceof ParameterDeclaration;
}
