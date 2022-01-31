/*
 * Copyright (C) 2021 TOSHIBA Corporation.
 * SPDX-License-Identifier: MIT
 */
import { AASMetamodel, ValidationResultIF } from './AASMetamodel';
import {
    ClassData,
    // PropertyData,
    IecCddClass,
    IecCddProp,
} from './IecCddClass';
import { ConvertRules, RuleData } from './ConvertRules';
import { ResultRetention } from './ResultRetention';
import * as util from './util';
import { getMsg, putConsoleErrorMsg } from './messages';
import { ConfigFileKeyword } from './const';

/**
 * result of conversion(cddconvert function returns)
 */
export interface ConvertResult {
    /**
     * result of conversion (true: if validation succeeds, false: if validation fails)
     */
    valid: boolean;
    /**
     * message
     */
    messageStrings: string[];
    /**
     * converted data(json)
     * */
    resultData: any;
    /**
     * Detailed error message
     */
     errorDetails: string[];
    }

/**
 * Message retention area output to console.error
 */
export let consoleErrorStrings: string[] = [];

/**
 * Perform conversion and validation using the conversion class group.
 *
 * Perform the following processing.
 * 
 * 1.Read the JSON of the argument input definition.
 * 2.Read the file (File1-4, template) with the contents of 1.
 * 3.Generate a conversion engine class group from the data read in 2.
 * 4.Call the conversion process with the conversion engine class group generated in 3 as an argument.
 * 5.Return the result.
 *
 * @param  {string} configPath Input definition file path
 * @returns Conversion processing result
 */
export async function cddconvert(configPath: string): Promise<ConvertResult> {
    consoleErrorStrings = [];

    // Read the JSON of the input definition.
    const configStr = (await util.promiseReadFile(configPath)) as string;
    const configJson = JSON.parse(configStr);
    if (
        !(
            ConfigFileKeyword.cddMetamodelFile in configJson &&
            ConfigFileKeyword.modelDataFileC in configJson &&
            ConfigFileKeyword.modelDataFileP in configJson &&
            ConfigFileKeyword.schemaFile in configJson &&
            ConfigFileKeyword.convertRuleFile in configJson &&
            ConfigFileKeyword.templateFile in configJson
        )
    ) {
        const msg = getMsg('EXCEPTION_NO_EXPECTEDKEY');
        throw new Error(msg);
    }

    // Load files1 to 4 and the template.

    // eslint-disable-next-line no-unused-vars
    const contentsCDDMetamodel = (await util.promiseReadFile(
        configJson.File1
    )) as string;
    const contentsIECCDDClass = (await util.promiseReadFile(
        configJson.File2class
    )) as string;
    const contentsIECCDDProperty = (await util.promiseReadFile(
        configJson.File2property
    )) as string;
    const contentsAASMetamodel = (await util.promiseReadFile(
        configJson.File3
    )) as string;
    const contentsConvertRules = (await util.promiseReadFile(
        configJson.File4
    )) as string;
    const contentsTemplate = (await util.promiseReadFile(
        configJson.Template
    )) as string;

    const resultmessage: string[] = [];

    // Generating a transformation engine class instance
    const classData = new IecCddClass(contentsIECCDDClass);
    const propData = new IecCddProp(contentsIECCDDProperty);
    const aasMetamodel = new AASMetamodel(contentsAASMetamodel);
    const ruleData = new ConvertRules(
        contentsConvertRules,
        classData.getHeader(),
        propData.getHeader()
    );
    const retention = new ResultRetention(contentsTemplate);

    let successNum = 0; // Number of successful data conversions

    // Conversion process for Class data
    const classrules = ruleData.getForClassRules();
    if (classrules.length === 0) {
        const msg = putConsoleErrorMsg('NO_RULE', 'Class');
        resultmessage.push(msg);
    } else {
        successNum += dataconvert(
            classData,
            classrules,
            retention,
            aasMetamodel
        );
    }
    // Conversion process for Property data
    const proprules = ruleData.getForPropertyRules();
    if (proprules.length === 0) {
        const msg = putConsoleErrorMsg('NO_RULE', 'Property');
        resultmessage.push(msg);
    } else {
        successNum += dataconvert(propData, proprules, retention, aasMetamodel);
    }

    aasMetamodel.validate(retention.getConfirmed());

    let resultvalid: boolean;
    if (
        resultmessage.length === 0 &&
        ruleData.isAllRulesValid() === true &&
        successNum === classData.getNumDatas() + propData.getNumDatas() &&
        consoleErrorStrings.length === 0
    ) {
        resultvalid = true;
        resultmessage.push(getMsg('ALL_SUCCESS')); // All conversion is succesed.
    } else {
        resultvalid = false;
        if (ruleData.isAllRulesValid() === false) {
            resultmessage.push(getMsg('UNAPPLIED_RULES')); // There are some rules that could not be applied.
        }
        if (successNum !== classData.getNumDatas() + propData.getNumDatas()) {
            resultmessage.push(getMsg('UNCONVERTED_DATA')); // Some data could not be converted.
        }
    }

    return {
        valid: resultvalid,
        messageStrings: resultmessage,
        resultData: retention.getConfirmed(),
        errorDetails: consoleErrorStrings,
    };
}

/**
 * Perform conversion using the conversion engine class group.
 * @param indata Model data to be converted
 * @param rules Conversion rules
 * @param retention ResultRetention class to output the conversion result
 * @param aasMetamodel AASMetamodel class for validation
 * @returns Number of data for which all processing (data conversion, output, default value output, validation) completed normally
 */
const dataconvert = (
    indata: IecCddClass | IecCddProp,
    rules: RuleData[],
    retention: ResultRetention,
    aasMetamodel: AASMetamodel
): number => {
    let successNum = 0;

    // Data loop {
    //     Initialize ResultRetention (temporary)
    //     Conversion rule loop for a few minutes {
    //         Conversion (Condition, Formula)
    //         When the conversion result is obtained
    //             Reflect the conversion result in Result Retention (temporary)
    //             Reflect Default value in Result Retention (temporary)
    //     }
    //     Validation of data held by Result Retention
    //     If validation passes
    //          Reflect ResultRetention (temporary) in ResultRetention (confirm)
    // }
    for (const data of indata.getDatas()) {
        let convertFail: boolean = false; // Conversion failure flag
        let outputConvertResultFail: boolean = false; // Conversion result output failure flag
        let outputDefaultResultFail: boolean = false; // Default value output failure flag
        let validateFail: boolean = false; // validation failure flag

        retention.initTemporary();

        for (const rule of rules) {
            if (rule.isValid()) {
                const value = rule.convert(data);
                if (value !== undefined) {
                    if (
                        retention.setData(
                            rule.getOutputLocation(),
                            rule.getOutputKey(),
                            value,
                            rule.getDataType(),
                            rule.getIdentifier()
                        ) === false
                    ) {
                        outputConvertResultFail = true;
                    } else {
                        for (const e of rule.getDefaultValues()) {
                            if (
                                retention.setData(
                                    e.getLocation(),
                                    e.getKey(),
                                    e.getData(),
                                    e.getDataType(),
                                    rule.getIdentifier()
                                ) === false
                            ) {
                                outputDefaultResultFail = true;
                                break;
                            }
                        }
                    }
                } else {
                    convertFail = true;
                }
            }
        }
        const result = aasMetamodel.validate(
            retention.getTemporary()
        ) as ValidationResultIF;
        if (!result.valid) {
            validateFail = true;
            putConsoleErrorMsg(
                'VALIDATION_ERROR',
                data instanceof ClassData ? 'Class' : 'Property',
                data.getIdentifier(),
                result.errorString!
            );
        } else {
            retention.confirme();
        }

        // When all the processes are completed correctly, the number of normal processes is incremented.
        if (
            convertFail === false &&
            outputConvertResultFail === false &&
            outputDefaultResultFail === false &&
            validateFail === false
        ) {
            successNum += 1;
        }
    }
    return successNum;
};
