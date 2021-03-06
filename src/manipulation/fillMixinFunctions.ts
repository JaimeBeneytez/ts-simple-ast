﻿import * as compiler from "./../compiler";
import * as structures from "./../structures";

export function fillAbstractableNodeFromStructure(node: compiler.AbstractableNode, structure: structures.AbstractableNodeStructure) {
    if (structure.isAbstract != null)
        node.setIsAbstract(structure.isAbstract);
}

export function fillAmbientableNodeFromStructure(node: compiler.AmbientableNode, structure: structures.AmbientableNodeStructure) {
    if (structure.hasDeclareKeyword != null)
        node.toggleDeclareKeyword(structure.hasDeclareKeyword);
}

export function fillAsyncableNodeFromStructure(node: compiler.AsyncableNode, structure: structures.AsyncableNodeStructure) {
    if (structure.isAsync != null)
        node.setIsAsync(structure.isAsync);
}

export function fillExportableNodeFromStructure(node: compiler.ExportableNode, structure: structures.ExportableNodeStructure) {
    if (structure.isExported != null)
        node.setIsExported(structure.isExported);
    if (structure.isDefaultExport != null)
        node.setIsDefaultExport(structure.isDefaultExport);
}

export function fillGeneratorableNodeFromStructure(node: compiler.GeneratorableNode, structure: structures.GeneratorableNodeStructure) {
    if (structure.isGenerator != null)
        node.setIsGenerator(structure.isGenerator);
}

export function fillInitializerExpressionableNodeFromStructure(
    node: compiler.InitializerExpressionableNode,
    structure: structures.InitializerExpressionableNodeStructure
) {
    if (structure.initializer != null)
        node.setInitializer(structure.initializer);
}

export function fillQuestionTokenableNodeFromStructure(node: compiler.QuestionTokenableNode, structure: structures.QuestionTokenableNodeStructure) {
    if (structure.hasQuestionToken != null)
        node.setIsOptional(structure.hasQuestionToken);
}

export function fillReadonlyableNodeFromStructure(node: compiler.ReadonlyableNode, structure: structures.ReadonlyableNodeStructure) {
    if (structure.isReadonly != null)
        node.setIsReadonly(structure.isReadonly);
}

export function fillScopeableNodeFromStructure(node: compiler.ScopeableNode, structure: structures.ScopeableNodeStructure) {
    if (structure.scope != null)
        node.setScope(structure.scope);
}

export function fillScopedNodeFromStructure(node: compiler.ScopedNode, structure: structures.ScopedNodeStructure) {
    if (structure.scope != null)
        node.setScope(structure.scope);
}

export function fillStaticableNodeFromStructure(node: compiler.StaticableNode, structure: structures.StaticableNodeStructure) {
    if (structure.isStatic != null)
        node.setIsStatic(structure.isStatic);
}

export function fillTypedNodeFromStructure(node: compiler.TypedNode, structure: structures.TypedNodeStructure) {
    if (structure.type != null)
        node.setType(structure.type);
}

export function fillImplementsClauseableNodeFromStructure(
    node: compiler.ImplementsClauseableNode,
    structure: structures.ImplementsClauseableNodeStructure
) {
    if (structure.implements != null && structure.implements.length > 0)
        node.addImplements(structure.implements);
}

export function fillExtendsClauseableNodeFromStructure(
    node: compiler.ExtendsClauseableNode,
    structure: structures.ExtendsClauseableNodeStructure
) {
    if (structure.extends != null && structure.extends.length > 0)
        node.addExtends(structure.extends);
}

export function fillTypeParameteredNodeFromStructure(
    node: compiler.TypeParameteredNode,
    structure: structures.TypeParameteredNodeStructure
) {
    if (structure.typeParameters != null && structure.typeParameters.length > 0)
        node.addTypeParameters(structure.typeParameters);
}

export function fillDecoratableNodeFromStructure(
    node: compiler.DecoratableNode,
    structure: structures.DecoratableNodeStructure
) {
    if (structure.decorators != null && structure.decorators.length > 0)
        node.addDecorators(structure.decorators);
}

export function fillDocumentationableNodeFromStructure(
    node: compiler.DocumentationableNode,
    structure: structures.DocumentationableNodeStructure
) {
    if (structure.docs != null && structure.docs.length > 0)
        node.addDocs(structure.docs);
}

export function fillReturnTypedNodeFromStructure(node: compiler.ReturnTypedNode, structure: structures.ReturnTypedNodeStructure) {
    if (structure.returnType != null)
        node.setReturnType(structure.returnType);
}

export function fillParameteredNodeFromStructure(
    node: compiler.ParameteredNode,
    structure: structures.ParameteredNodeStructure
) {
    if (structure.parameters != null && structure.parameters.length > 0)
        node.addParameters(structure.parameters);
}

export function fillStatementedNodeFromStructure(
    node: compiler.StatementedNode,
    structure: structures.StatementedNodeStructure
) {
    if (structure.classes != null && structure.classes.length > 0)
        node.addClasses(structure.classes);
    if (structure.enums != null && structure.enums.length > 0)
        node.addEnums(structure.enums);
    if (structure.functions != null && structure.functions.length > 0)
        node.addFunctions(structure.functions);
    if (structure.interfaces != null && structure.interfaces.length > 0)
        node.addInterfaces(structure.interfaces);
    if (structure.namespaces != null && structure.namespaces.length > 0)
        node.addNamespaces(structure.namespaces);
    if (structure.typeAliases != null && structure.typeAliases.length > 0)
        node.addTypeAliases(structure.typeAliases);
}
