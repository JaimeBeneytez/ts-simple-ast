﻿import * as compiler from "./../compiler";
import * as structures from "./../structures";

export function fillOnlySourceFileFromStructure(node: compiler.SourceFile, structure: structures.SourceFileSpecificStructure) {
    if (structure.imports != null)
        node.addImports(structure.imports);
    if (structure.exports != null)
        node.addExports(structure.exports);
}

export function fillOnlyClassDeclarationFromStructure(node: compiler.ClassDeclaration, structure: structures.ClassDeclarationSpecificStructure) {
    if (structure.extends != null)
        node.setExtends(structure.extends);
    if (structure.ctor != null)
        node.addConstructor(structure.ctor);
    if (structure.properties != null)
        node.addProperties(structure.properties);
    if (structure.methods != null)
        node.addMethods(structure.methods);
}

export function fillOnlyInterfaceDeclarationFromStructure(node: compiler.InterfaceDeclaration, structure: structures.InterfaceDeclarationSpecificStructure) {
    if (structure.constructSignatures != null)
        node.addConstructSignatures(structure.constructSignatures);
    if (structure.properties != null)
        node.addProperties(structure.properties);
    if (structure.methods != null)
        node.addMethods(structure.methods);
}

export function fillOnlyEnumDeclarationFromStructure(node: compiler.EnumDeclaration, structure: structures.EnumDeclarationSpecificStructure) {
    if (structure.isConst != null)
        node.setIsConstEnum(structure.isConst);
    if (structure.members != null && structure.members.length > 0)
        node.addMembers(structure.members);
}

export function fillOnlyNamespaceDeclarationFromStructure(node: compiler.NamespaceDeclaration, structure: structures.NamespaceDeclarationSpecificStructure) {
    if (structure.hasModuleKeyword != null)
        node.setHasModuleKeyword(structure.hasModuleKeyword);
}
