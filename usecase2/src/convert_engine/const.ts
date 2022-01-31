/*
 * Copyright (C) 2021 TOSHIBA Corporation.
 * SPDX-License-Identifier: MIT
 */

/**
 * Message language
 */
export const msgkey = 'str'; // 'str' is English, 'strJ' is Japanese.

/**
 * key of config.json
 */
export const ConfigFileKeyword = {
    cddMetamodelFile: 'File1', // CDD Metamodel file
    modelDataFileC: 'File2class', // IEC CDD Model data (class)
    modelDataFileP: 'File2property', // IEC CDD Model data (property)
    schemaFile: 'File3', // AAS Metamodel schema
    convertRuleFile: 'File4', // Convertion Rule file
    templateFile: 'Template', // outdata Templeate
};

/**
 * Defined values for lines in the model data file
 */
export const ModelDataFile = {
    header: '#PROPERTY_NAME.en', // Lines treated as data headings
    ignoreLine: '#', // Keywords for rows that are not treated as data
};

/**
 * column name in the model data file
 */
export const ModelDataColName = {
    code: 'Code', // for identifier
};

/**
 * Definition value for a line in the conversion rule file
 */
export const convertRuleFile = {
    header: '#name', // Lines treated as data headings
    ignoreLine: '#', // Keywords for rows that are not treated as data
};

/**
 * Column name
 */
export const convertRuleColName = {
    code: 'Code',
    formula: 'Formula',
    condition: 'Condition',
    defaultvalue: 'Default value',
    mm1model: 'MM1 model',
    mm1element: 'MM1 Element',
    mm2element: 'MM2 Element',
    mm2model: 'MM2 model',
};

/**
 * keyword of Formula
 */
export const FormulaKeyword = {
    list2array: '$List2Array',
};

/**
 * keyword of Condition
 */
export const ConditionKeyword = {
    useInputvalue: '$in',
    condEqual: '==',
    condNotEqual: '!=',
};

/**
 * keyword of Default value
 */
export const DefaultvalueKeyword = {
    emptyObject: '$emptyObject',
    emptyArray: '$emptyArray',
    empryString: '$emptyString',
};

/**
 * keyword of related to the type of output data
 */
export const DataType = {
    String: 'string',
    List2Array: 'list2array',
    EmptyObject: 'emptyObject',
    EmptyArray: 'emptyArray',
};
