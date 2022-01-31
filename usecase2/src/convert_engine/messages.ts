/*
 * Copyright (C) 2021 TOSHIBA Corporation.
 * SPDX-License-Identifier: MIT
 */
import { msgkey } from './const';
import { consoleErrorStrings } from './cddconvert';

/**
 * message strings for console,UI
 */
interface MESSAGE {
    id: string;
    str: string;
    strJ: string;
}
const MESSAGES: Array<MESSAGE> = [
    {
        id: 'EXCEPTION_NO_EXPECTEDKEY',
        str: `Expected key does not exist in config file.`,
        strJ: `定義ファイルに必要なキーが存在しません.`,
    },
    {
        id: 'EXCEPTION_PARSE_AASMETAMODEL',
        str: `Exception at parsing AAS Metamodel to JSON.({0})`,
        strJ: `AAS MetamodelからJSONデータへのパースで例外が発生しました.({0})`,
        // {0} : Exception message
    },
    {
        id: 'EXCEPTION_COMPILE_AASMETAMODEL',
        str: `Exception at parsing AAS Metamodel to schema.({0})`,
        strJ: `AAS Metamodelからschemaへのパースで例外が発生しました.({0})`,
        // {0} : Exception message
    },
    {
        id: 'EXCEPTION_PARSE_TEMPLATE',
        str: `Exception at parsing Template data to JSON. ({0})`,
        strJ: `テンプレートからJSONデータへのパースで例外が発生しました.({0})`,
        // {0} : Exception message
    },
    {
        id: 'EXCEPTION_IECCDD_NOHEADER',
        str: `The header line is not found in IEC CDD model. (No "{0}" Line)`,
        strJ: `IEC CDDファイルに見出し行がありません. ("{0}"の行がありません)`,
        // {0} : header column word
    },
    {
        id: 'EXCEPTION_INVALID_COLUMNNUM',
        str: `The number of columns differs between header line and data line in IEC CDD file or Convert Rules file.`,
        strJ: `IEC CDDファイルまたは変換ルール定義ファイルの見出し行とデータ行のカラム数が異なるものがあります.`,
    },
    {
        id: 'EXCEPTION_RULES_NOHEADER',
        str: `The header line is not found in Convert Rules file. (No "{0}" Line)`,
        strJ: `変換ルール定義ファイルに見出し行がありません. ("{0}"の行がありません)`,
        // {0} : header column word
    },
    {
        id: 'UNEXPECTED_CONDITION',
        str: `Disable "{0}" conversion rule. Unexpected "Condition" Value. ({1})`,
        strJ: `変換ルール({0})を無効としました. Conditionの"{1}"は意図しない値です.`,
        // {0} : Rule identifier
        // {1} : Unexpected value
    },
    {
        id: 'UNEXPECTED_FORMULA',
        str: `Disable "{0}" conversion rule. Unexpected "Formula" Value. ({1})`,
        strJ: `変換ルール({0})を無効としました. Formulaの"{1}"は意図しない値です.`,
        // {0} : Rule identifier
        // {1} : Unexpected value
    },
    {
        id: 'UNEXPECTED_FORMULA_REGEXP',
        str: `Disable "{0}" conversion rule. The regular expression specified in "Formula" is invalid. ({1})`,
        strJ: `変換ルール({0})を無効としました. Formulaに指定された正規表現"{1}"が不正です. `,
        // {0} : Rule identifier
        // {1} : Unexpected value
    },
    {
        id: 'UNEXPECTED_DEFAULTVALUE',
        str: `Disable "{0}" conversion rule. Unexpected "Default value". ({1})`,
        strJ: `変換ルール({0})を無効としました. Default valueの"{1}"は意図しない値です.`,
        // {0} : Rule identifier
        // {1} : Unexpected value
    },
    {
        id: 'UNEXPECTED_NO_MM2ELEMENT',
        str: `Disable "{0}" conversion rule. "MM1 element" is specified, but "MM2 element" is not specified.`,
        strJ: `変換ルール({0})を無効としました. MM1 elementの指定がありますがMM2 elementの指定がありません.`,
        // {0} : Rule identifier
    },
    {
        id: 'UNEXPECTED_MM1MODEL',
        str: `Disable "{0}" conversion rule. Unexpected "MM1 model" value(not "class" or "property").`,
        strJ: `変換ルール({0})を無効としました. MM1 modelが意図しない値です(MM1 modelは"class"か"property"です).`,
        // {0} : Rule identifier
    },
    {
        id: 'UNEXPECTED_NO_MM2MODEL',
        str: `Disable "{0}" conversion rule. No Output Location("MM2 model").`,
        strJ: `変換ルール({0})を無効としました. MM2 modelがありません.`,
        // {0} : Rule identifier
    },
    {
        id: 'DISABLERULE_CONDITION_INCONSISTENCY',
        str: `Disable "{0}" conversion rule. Inconsistency between column name of model data and "Condition".`,
        strJ: `変換ルール({0})を無効としました. Conditionの指定とモデルデータのカラム名に不整合を検出しました.`,
        // {0} : Rule identifier
    },
    {
        id: 'DISABLERULE_INLOCATION_INCONSISTENCY',
        str: `Disable "{0}" conversion rule. Inconsistency between column name of model data and "MM1 model or MM1 element" ({1}).`,
        strJ: `変換ルール({0})を無効としました. MM1 model, MM1 elementの指定({1})とモデルデータのカラム名に不整合を検出しました.`,
        // {0} : Rule identifier
        // {1} : MM1 element
    },
    {
        id: 'INCONSISTENCY_DESTINATION_NO_ARRAY',
        str: `Failed to put converted data of "{0}" conversion rule. {1}[] is specified, but not an array.`,
        strJ: `変換ルール({0})の変換結果の出力に失敗しました. {1}[]が指定されましたが配列ではありません.`,
        // {0} : Rule identifier
        // {1} : destination that was not an Array
    },
    {
        id: 'INCONSISTENCY_DESTINATION_NO_ARRAY_OR_EMTTY',
        str: `Failed to put converted data of "{0}" conversion rule. {1}[-1] is specified, but not an array or no elements.`,
        strJ: `変換ルール({0})の変換結果の出力に失敗しました. {1}[-1]が指定されましたが配列でないか要素がありません.`,
        // {0} : Rule identifier
        // {1} : destination that was not an Array
    },
    {
        id: 'CONDITION_NO_MATCH',
        str: `The conversion result by the conversion rule ({0}) of the {1} data ({2}) is not output because "Condition" is not satisfied.`,
        strJ: `Conditionの条件を満たさないため、変換ルール({0})による{1}データ({2})の変換結果は出力されません.`,
        // {0} : Rule identifier
        // {1} : Class or Property
        // {2} : model data identifier
    },
    {
        id: 'FORMULA_UNMATCH_REGEXP',
        str: `The conversion result by the conversion rule ({0}) of the {1} data ({2}) will be an empty string by the regular expression of "Formula".`,
        strJ: `Formulaの正規表現により、変換ルール({0})による{1}データ({2})の変換結果は空文字列となります.`,
        // {0} : Rule identifier
        // {1} : 'Class' or 'Property'
        // {2} : model data identifier
    },
    {
        id: 'FORMULA_FAIL_LIST2ARRAY',
        str: `The conversion result by the conversion rule ({0}) of the {1} data ({2}) is not output because failed to Array generation by "Formula". ({3})`,
        strJ: `Formulaによる配列の生成に失敗したため、{1}データ({2})の変換ルール({0})による変換結果は出力されません. ({3})`,
        // {0} : Rule identifier
        // {1} : 'Class' or 'Property'
        // {2} : model data identifier
        // {3} : string as List2Array failed
    },
    {
        id: 'VALIDATION_ERROR',
        str: `{0} Data ({1}) conversion result validation failed.({2})`,
        strJ: `{0}({1})の変換結果のバリデーションでエラーが発生しました.({2})`,
        // {0} : Class or Property
        // {1} : model data identifier
        // {2} : validation error message
    },
    {
        // 【for engine and ui】
        id: 'NO_RULE',
        str: `There are no valid convert rules for {0} data. {0} data is not converted.`,
        strJ: `{0}データに対する変換ルールがありません. {0}データは変換されません.`,
        // {0} : Class or Property
    },
    {
        // 【for UI】
        id: 'ALL_SUCCESS',
        str: 'All conversions are complete.',
        strJ: `すべての変換が完了しました.`,
    },
    {
        // 【for UI】
        id: 'UNAPPLIED_RULES',
        str: 'Some convert rules could not be applied.',
        strJ: `適用できなかった変換ルールがあります.`,
    },
    {
        // 【for UI】
        id: 'UNCONVERTED_DATA',
        str: 'Some data could not be converted.',
        strJ: `変換できなかったデータがあります.`,
    },
    {
        id: 'EXCEPTION_LOGICAL_ERROR',
        str: `A logical error has occurred.({0})`,
        strJ: `論理エラーが発生しました.({0})`,
        // {0} : Additional Information
    },
];

/**
 * Assemble the message
 * @param idname id of message
 * @param args Value to embed in messagee
 * @returns message string
 */
export const getMsg = (idname: string, ...args: string[]): string => {
    const msgstr = MESSAGES.find((m) => {
        return m.id === idname;
    });
    if (msgstr === undefined) {
        throw new Error(`getMsg was called with an undefined message ID.`);
    }
    const _msgkey = msgkey as keyof MESSAGE;
    return msgstr[_msgkey].replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] !== 'undefined' ? args[number] : match;
    });
};

/**
 * Assemble the message and output it to console.error.
 * @param idname id of message
 * @param args Value to embed in message
 * @returns message
 */
export const putConsoleErrorMsg = (
    idname: string,
    ...args: string[]
): string => {
    const msg = getMsg(idname, ...args);
    console.error(msg);
    consoleErrorStrings.push(msg);
    return msg;
};
