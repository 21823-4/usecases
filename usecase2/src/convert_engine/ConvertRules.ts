/*
 * Copyright (C) 2021 TOSHIBA Corporation.
 * SPDX-License-Identifier: MIT
 */
import { ClassData, PropertyData } from './IecCddClass';
import { getMsg, putConsoleErrorMsg } from './messages';
import * as util from './util';
import {
    convertRuleFile,
    convertRuleColName,
    FormulaKeyword,
    ConditionKeyword,
    DefaultvalueKeyword,
    DataType,
} from './const';

const jCsv = require('jquery-csv');

/**
 * Column name of conversion rule file (csv).
 * The #name identifier is not case sensitive, so treat it in all lowercase.
 */
class ColumnName {
    static code: string = convertRuleColName.code.toLowerCase();

    static formula: string = convertRuleColName.formula.toLowerCase();
    static condition: string = convertRuleColName.condition.toLowerCase();
    static defaultvalue: string = convertRuleColName.defaultvalue.toLowerCase();
    static mm1model: string = convertRuleColName.mm1model.toLowerCase();
    static mm1element: string = convertRuleColName.mm1element.toLowerCase();
    static mm2element: string = convertRuleColName.mm2element.toLowerCase();
    static mm2model: string = convertRuleColName.mm2model.toLowerCase();
}

/**
 * Input metamodel type and class of information for the input metamodel element
 *
 * Also used as part of the Condition.
 */
class InputLocation {
    /**
     * Information in the'MM1 model' column of the conversion rule
     */
    model: string = '';
    /**
     * Information in the'MM1 element' column of the conversion rule
     */
    element: string = '';

    /**
     * Get the input to be converted.
     * @param data Input model data
     */
    getInputValue(data: ClassData | PropertyData): string {
        if (!util.isExist(this.element)) {
            // If element is an empty string, returns an empty string
            return '';
        }
        return data.getData(this.element);
    }

    /**
     * コンストラクタ
     * @param model Information in the'MM1 model' column of the conversion rule
     * @param element Information in the'MM1 element' column of the conversion rule
     */
    constructor(model: string, element: string) {
        this.model = model;
        this.element = element;

        // File2 column names are accessed in lowercase
        this.element = this.element.toLowerCase();
    }

    /**
     * Check if there is any inconsistency between the InputLocation information and the IEC CDD heading information.
     * @param modelHeader IEC CDD heading information
     * @returns Returns false if inconsistency is detected, otherwise returns true.
     */
    checkWithHeader(modelHeader: string[]): boolean {
        // check for MM1 element
        if (!util.isExist(this.element)) {
            // No check processing for empty string (not specified)
            return true;
        }
        if (!modelHeader.includes(this.element)) {
            return false;
        }
        return true;
    }
}

/**
 * A class of information about the output metamodel element and the type of metamodel to output
 *
 * Also used as part of DefaultValue.
 */
class OutputLocation {
    /**
     * Key name to output data
     *
     * key = 'KEY"
     * => { "KEY" : data }
     */
    key: string = '';
    /**
     * Object hierarchy information that is the output position
     */
    location: string[] = [];

    /**
     * constructor
     * @param model Information in the'MM2 model' column of the conversion rule
     * @param element Information in the'MM2 element' column of the conversion rule
     */
    constructor(model: string, element: string) {
        this.key = element;
        this.location = model.split('.');
    }

    /**
     * Get the object hierarchy information that is the output position.
     * @returns Object hierarchy information that is the output position
     */
    getLocation(): string[] {
        return this.location;
    }

    /**
     * Get the key name.
     * @returns Key name
     */
    getKey(): string {
        return this.key;
    }
}

/**
 * Input / output conversion formula information class
 */
class Formula {
    /**
     *Regular expression used in conversion
     */
    reg: RegExp | undefined;

    /**
     * Data type by Formula
     */
    dataType: string = DataType.String;

    /**
     * constructor
     * @param strOrReg String ‘$ List2Array’ or a regular expression used in the conversion
     */
    constructor(strOrReg: string | RegExp) {
        if (
            typeof strOrReg === 'string' &&
            strOrReg === FormulaKeyword.list2array
        ) {
            this.dataType = DataType.List2Array;
            this.reg = undefined;
            this.replace = this.list2arrayCheck;
        } else if (strOrReg instanceof RegExp) {
            this.dataType = DataType.String;
            this.reg = strOrReg;
            this.replace = this.sub;
        } else {
            const msg = getMsg('EXCEPTION_LOGICAL_ERROR', util.getStack());
            throw new Error(msg);
        }
    }

    /**
     * Perform conversion by Formula
     * @description Either sub or list2array is set in the constructor.
     * @param before Data before applying Formula
     */
    replace(before: string): string | object | undefined {
        const msg = getMsg('EXCEPTION_LOGICAL_ERROR', util.getStack());
        throw new Error(msg);
    }

    /**
     * Apply regular expression
     *
     * If it does not match the regular expression, it returns an empty string.
     * @param before Data before application
     * @returns Data after application
     */
    sub(before: string): string {
        const matchRes = before.match(this.reg as RegExp);
        if (matchRes !== null) {
            return matchRes[0];
        } else {
            return '';
        }
    }

    /**
     * list2array Check if the target string is what you intended
     * @param before list2array Target string
     * @returns If it is not the intended one, it returns undefined. Otherwise, it returns the argument as it is.
     */
    list2arrayCheck(before: string): string | undefined {
        /*  If you make it into an Array at this stage,
            When there is a rule to output for the objectified element,
            It may be an unintended operation.
            For this reason, we decided to perform Array conversion at the point just before the output.
            Here, only the check for Array is performed, and the character string is simply returned as it is. */
        if (util.isExist(before)) {
            const matchret = before.match(/^{(.*)}$/);
            if (matchret == null || matchret.length !== 2) {
                return undefined;
            }
        }
        return before;
    }

    /**
     * Returns the output type of Formula
     * @returns Default value output data
     */
    getDataType(): string {
        return this.dataType;
    }
}

/**
 * A class that indicates that $ in is used as the output value in Condition.judge.
 *
 * It is used as a mold and has no function.
 */
class UseInputLocation {}

/**
 * A class of information on the conditions for the conversion rule to hold
 */
class Condition {
    /**
     * Left side of conditional expression
     */
    left: InputLocation;
    /**
     * Right side of conditional expression
     */
    right: string;
    /**
     * Comparison operator
     */
    cond: string;
    /**
     * Output value
     */
    outdata: any;

    /**
     * constructor
     *
     * One specification of Condition: model.element cond (==) compared: outdata
     * @param model model (class or property)
     * @param element element
     * @param cond Comparison operator
     * @param compared Comparison value
     * @param outdata Output value
     */
    constructor(
        model: string,
        element: string,
        cond: string,
        compared: string,
        outdata: string
    ) {
        this.left = new InputLocation(model.trim(), element.trim());
        this.cond = cond;
        this.right = compared;
        this.outdata = outdata;
    }

    /**
     * Judges whether the conditional expression is satisfied and returns the specified output value.
     *
     * If the conditional expression is satisfied, the output string. If $ in, UseInputLocation is returned.
     * If the conditional expression does not hold, undefined is returned.
     * @param data Input data
     * @returns Output value. UseInputLocation means the $ in keyword. Undefined means that the conditional expression does not hold.
     */
    judge(
        data: ClassData | PropertyData
    ): string | UseInputLocation | undefined {
        const leftSide = this.left!.getInputValue(data);
        const cond = this.cond;
        let rightSide = this.right;

        rightSide = util.replaceWrapQuarts(this.right);

        // condition can only describe string comparison
        if (typeof leftSide === 'string') {
            // Currently only == and! =, So it is judged by match
            const matchRes = leftSide.match(
                rightSide
                    .replace(/[.*+?^=!:${}()|[\]\\/\\]/g, '\\$&')
                    .replace('\\*\\*\\*', '.*')
                    .replace(/.*/, '^$&$')
            );

            if (
                (cond === ConditionKeyword.condEqual && matchRes != null) ||
                (cond === ConditionKeyword.condNotEqual && matchRes == null)
            ) {
                if (this.outdata === ConditionKeyword.useInputvalue) {
                    return new UseInputLocation();
                }
                return util.replaceWrapQuarts(this.outdata);
            }
        }
        return undefined;
    }

    /**
     * Check if there is any inconsistency between the Condition information and the IEC CDD heading information.
     * @param modelHeader IEC CDD heading information
     * @returns Returns false if inconsistency is detected, otherwise returns true.
     */
    checkWithHeader(modelHeader: string[]): boolean {
        return this.left.checkWithHeader(modelHeader);
    }
}

/**
 * Class of default value information of output schema
 */
class DefaultValue {
    /**
     * Object hierarchy information that is the output position and key name
     */
    outputlocation: OutputLocation;
    /**
     * Value to be output to key
     */
    outdata: any;

    /**
     * Type of data by Default value
     */
    dataType: string = DataType.String;

    /**
     * constructor
     *
     * One specification of Default value: model.element = outdata
     * @param model model (class or property)
     * @param element element
     * @param outdata Output value
     */
    constructor(model: string, element: string, outdata: string) {
        this.outputlocation = new OutputLocation(model, element);

        if (outdata === DefaultvalueKeyword.emptyObject) {
            this.dataType = DataType.EmptyObject;
        } else if (outdata === DefaultvalueKeyword.emptyArray) {
            this.dataType = DataType.EmptyArray;
        } else if (outdata === DefaultvalueKeyword.empryString) {
            this.dataType = DataType.String;
            this.outdata = '';
        } else {
            this.dataType = DataType.String;
            this.outdata = util.replaceWrapQuarts(outdata.trim());
        }
    }

    /**
     * Returns the object hierarchy information that is the output position
     * @returns Object hierarchy information that is the output position
     */
    getLocation(): string[] {
        return this.outputlocation.getLocation();
    }

    /**
     * Returns the key name that is the output position
     * @returns Key name that is the output position
     */
    getKey(): string {
        return this.outputlocation.getKey();
    }

    /**
     * Returns the output type of Default value
     * @returns Default value output data
     */
    getDataType(): string {
        return this.dataType;
    }

    /**
     * Returns the output data of Default value
     * @returns Default value output data
     */
    getData(): any {
        return this.outdata;
    }
}

/**
 * A class that holds information for one conversion rule
 */
export class RuleData {
    /**
     * Column name that is the identifier of the data
     */
    identifierColumnName = ColumnName.code;

    /**
     * Data that holds CSV row data.
     * @description It becomes the form. {Heading row column name: Data, ... }
     */
    csvLineObj: any = {};

    /**
     * Input-to-output conversion formula information class instance
     */
    formula: Formula | null = null;

    /**
     * Class instance of condition information for the conversion rule to hold
     */
    conditions: Condition[] = [];

    /**
     * Information on the Default value of the output schema
     */
    defaultValues: DefaultValue[] = [];

    /**
     * A class instance of the input metamodel type and information about the input metamodel elements
     */
    inputlocation: InputLocation | null = null;

    /**
     * A class instance of output metamodel elements and information about the type of metamodel to output
     */
    outputlocation: OutputLocation | null = null;

    /**
     * Is it a valid conversion rule?
     */
    validRule: boolean = true;

    /**
     * Is it a rule for class or a rule for property?
     */
    ruleFor: string = '';

    /**
     *Conversion result data type
     */
    dataType: string = DataType.String;

    /**
     * Generate Formula from Formula information.
     * @param formulaStr The character string described in the Formula column
     * @returns Formula instance. Null if generation fails.
     */
    private generateFormula(formulaStr: string): Formula | null {
        if (!util.isExist(formulaStr)) {
            return null;
        }

        // Formula designation is one of the following
        // - Sub(/Regular expressions/)
        // - $List2Array

        if (/^Sub\(\/.*\/\)$/.test(formulaStr)) {
            const substring = formulaStr
                .replace(/^Sub\(\//g, '')
                .replace(/\/\)$/, '');
            try {
                const reg = new RegExp(substring);
                return new Formula(reg);
            } catch (error) {
                putConsoleErrorMsg(
                    'UNEXPECTED_FORMULA_REGEXP',
                    this.getIdentifier(),
                    formulaStr
                );
                this.setInvalid();
                return null;
            }
        } else if (formulaStr === FormulaKeyword.list2array) {
            this.dataType = DataType.List2Array;
            return new Formula(formulaStr);
        } else {
            putConsoleErrorMsg(
                'UNEXPECTED_FORMULA',
                this.getIdentifier(),
                formulaStr
            );
            this.setInvalid();
            return null;
        }
    }

    /**
     * Generate Condition [] from Condition information.
     * @param conditionStr The character string described in the Condition column
     * @returns Condition array of instances
     */
    private generateConditions(conditionStr: string): Condition[] {
        if (!util.isExist(conditionStr)) {
            return [];
        }
        const retArray: Condition[] = [];
        const strArray = conditionStr.split(';');

        for (let i = 0; i < strArray.length; i++) {
            const str = strArray[i];
            // str => class.AAA=='BBB' : 'XXX'

            // Get output value
            let outdata = '';
            const expandvalue = str.split(':');
            // expandvalue[0] => class.AAA=='BBB'
            // expandvalue[1] => 'XXX'
            if (expandvalue.length !== 2) {
                putConsoleErrorMsg(
                    'UNEXPECTED_CONDITION',
                    this.getIdentifier(),
                    str
                );
                this.setInvalid();
                return [];
            } else {
                outdata = expandvalue[1].trim(); // Output value
            }

            // Get comparison conditions
            const expand = expandvalue[0].trim();
            let cond = '';
            if (expand.indexOf(ConditionKeyword.condNotEqual) >= 1) {
                // >=1 becouse top of string isnot cond.
                cond = ConditionKeyword.condNotEqual;
            } else if (expand.indexOf(ConditionKeyword.condEqual) >= 1) {
                cond = ConditionKeyword.condEqual;
            } else {
                putConsoleErrorMsg(
                    'UNEXPECTED_CONDITION',
                    this.getIdentifier(),
                    str
                );
                this.setInvalid();
                return [];
            }

            let model = '';
            let element = '';
            let compared = '';
            const comparison = expand.split(cond);
            // comparison[0] => class.AAA
            // comparison[1] => 'BBB'
            if (comparison.length !== 2) {
                putConsoleErrorMsg(
                    'UNEXPECTED_CONDITION',
                    this.getIdentifier(),
                    expand
                );
                this.setInvalid();
                return [];
            } else {
                const modelelement = comparison[0].trim().split('.');
                // modelelement[0] => class
                // modelelement[1] => AAA
                if (modelelement.length !== 2) {
                    putConsoleErrorMsg(
                        'UNEXPECTED_CONDITION',
                        this.getIdentifier(),
                        comparison[0]
                    );
                    this.setInvalid();
                    return [];
                } else if (
                    this.csvLineObj[ColumnName.mm1model].trim() !==
                    modelelement[0].trim()
                ) {
                    // Error if MM1 model and Condition model are different.
                    putConsoleErrorMsg(
                        'UNEXPECTED_CONDITION',
                        this.getIdentifier(),
                        modelelement[0]
                    );
                    this.setInvalid();
                    return [];
                } else {
                    model = modelelement[0].trim();
                    element = modelelement[1].trim();
                    compared = comparison[1].trim();
                }
            }

            retArray.push(
                new Condition(model, element, cond, compared, outdata)
            );
        }
        return retArray;
    }

    /**
     * Generate DefaultValue [] from Default value information.
     * @param defaultvalueStrThe string described in the Default value column
     * @returns Array of DefaultValue instances
     */
    private generateDefaultValues(defaultvalueStr: string): DefaultValue[] {
        if (!util.isExist(defaultvalueStr)) {
            return [];
        }

        const code = this.getIdentifier();
        const retArray: DefaultValue[] = [];

        const strArray = defaultvalueStr.split(';');
        for (let i = 0; i < strArray.length; i++) {
            const str = strArray[i];
            // str => word1.word2[].word3='AAA'

            const lockey = str.split('=');
            // lockey[0] => word1.word2[].word3
            // lockey[1] => 'AAA'
            if (lockey.length !== 2) {
                putConsoleErrorMsg('UNEXPECTED_DEFAULTVALUE', code, str);
                this.setInvalid();
                return [];
            } else {
                const ret = lockey[0].trim().match(/(^.+)\.([^.]+$)/);
                // ret[0] => word1.word2[].word3
                // ret[1] => word1.word2[]
                // ret[2] => word3
                if (ret != null && ret.length === 3) {
                    retArray.push(
                        new DefaultValue(
                            ret[1].trim(),
                            ret[2].trim(),
                            lockey[1].trim()
                        )
                    );
                } else {
                    putConsoleErrorMsg(
                        'UNEXPECTED_DEFAULTVALUE',
                        code,
                        lockey[0]
                    );
                    this.setInvalid();
                    return [];
                }
            }
        }
        return retArray;
    }

    /**
     * Check for inconsistencies between RuleData information and IEC CDD heading information.
     * @description Inquire about the included Condition and Input Location information.
     * @param modelHeader IEC CDD heading information
     * @returns Returns false if inconsistency is detected, otherwise returns true.
     */
    checkWithHeader(modelHeader: string[]): boolean {
        /**
         * If an inconsistency is detected, it will be updated with an OR with true.
         * If this.isValid () is false, invalid remains true even if subsequent checks do not detect any problems.
         */
        let invalid: boolean = !this.isValid();

        // For Formula, Default value, OutputLocation, there are no check items with the heading information of IEC CDD.
        const code = this.getIdentifier();

        this.conditions.forEach((e) => {
            if (!e.checkWithHeader(modelHeader)) {
                putConsoleErrorMsg('DISABLERULE_CONDITION_INCONSISTENCY', code);
                invalid = invalid || true;
            }
        });
        if (this.inputlocation != null) {
            if (!this.inputlocation.checkWithHeader(modelHeader)) {
                putConsoleErrorMsg(
                    'DISABLERULE_INLOCATION_INCONSISTENCY',
                    code,
                    this.inputlocation.element
                );
                invalid = invalid || true;
            }
        }

        if (invalid === true) {
            this.setInvalid();
        }

        return this.isValid();
    }

    /**
     * constructor
     * @param header Array of conversion rule headers
     * @param data Array of transformation rule data
     */
    constructor(header: Array<string>, data: Array<string>) {
        if (header.length !== data.length) {
            // It is assumed that the array of column names in the heading row and the number of elements in the data array are equal.
            const msg = getMsg('EXCEPTION_INVALID_COLUMNNUM');
            throw new Error(msg);
        }

        for (let i = 0; i < data.length; i++) {
            this.csvLineObj[header[i]] = util.importExcelString(data[i]);
        }

        const mm1modelStr = this.csvLineObj[ColumnName.mm1model];
        const mm1elementStr = this.csvLineObj[ColumnName.mm1element];
        const mm2modelStr = this.csvLineObj[ColumnName.mm2model];
        const mm2elementStr = this.csvLineObj[ColumnName.mm2element];

        // Unexpected value that MM1 element is specified but No MM2 element.
        if (util.isExist(mm1elementStr) && !util.isExist(mm2elementStr)) {
            putConsoleErrorMsg(
                'UNEXPECTED_NO_MM2ELEMENT',
                this.getIdentifier()
            );
            this.setInvalid();
        } else {
            // MM1 model, MM1 element => InputLocation
            if (mm1modelStr !== 'class' && mm1modelStr !== 'property') {
                putConsoleErrorMsg('UNEXPECTED_MM1MODEL', this.getIdentifier());
                this.setInvalid();
            } else {
                this.ruleFor = mm1modelStr;
                this.inputlocation = new InputLocation(
                    mm1modelStr.trim(),
                    mm1elementStr.trim()
                );
            }

            // MM2 model, MM2 element => InputLocation
            if (!util.isExist(mm2modelStr)) {
                putConsoleErrorMsg(
                    'UNEXPECTED_NO_MM2MODEL',
                    this.getIdentifier()
                );
                this.setInvalid();
            } else {
                this.outputlocation = new OutputLocation(
                    mm2modelStr.trim(),
                    mm2elementStr.trim()
                );
            }
        }

        // Formula
        this.formula = this.generateFormula(
            this.csvLineObj[ColumnName.formula]
        );

        // Condition => Condition[]
        this.conditions = this.generateConditions(
            this.csvLineObj[ColumnName.condition]
        );

        // Default value => DefaultValue[]
        this.defaultValues = this.generateDefaultValues(
            this.csvLineObj[ColumnName.defaultvalue]
        );
    }

    /**
     * Returns whether the rule is valid.
     * @returns Returns true if the rule is valid, false otherwise.
     */
    isValid(): boolean {
        return this.validRule;
    }

    /**
     * Set the rule to an invalid rule.
     */
    setInvalid(): void {
        this.validRule = false;
    }

    /**
     * Convert according to the conversion rule.
     * @param data ClassData or PropertyData
     * @returns Conversion result data. Undefined if there is no conversion result.
     */
    convert(data: ClassData | PropertyData): any | undefined {
        let outdata;

        if (this.conditions.length > 0) {
            for (let i = 0; i < this.conditions.length; ++i) {
                const condition = this.conditions[i];
                const res = condition.judge(data);
                if (typeof res !== 'undefined') {
                    outdata = res;
                    break;
                }
            }
            // when not match conditions are 'undefined'.
            if (outdata === undefined) {
                putConsoleErrorMsg(
                    'CONDITION_NO_MATCH',
                    this.getIdentifier(),
                    this.ruleFor,
                    data.getIdentifier()
                );
                return undefined;
            }
            if (outdata instanceof UseInputLocation) {
                // condition result is keyword '$in'.
                // Formula processing is executed only when $ in is output.
                outdata = this.inputlocation?.getInputValue(data) as string;

                if (this.formula !== null) {
                    outdata = this.formula.replace(outdata);
                    if (
                        this.getDataType() !== DataType.List2Array &&
                        outdata === ''
                    ) {
                        putConsoleErrorMsg(
                            'FORMULA_UNMATCH_REGEXP',
                            this.getIdentifier(),
                            this.ruleFor,
                            data.getIdentifier()
                        );
                    } else if (outdata === undefined) {
                        putConsoleErrorMsg(
                            'FORMULA_FAIL_LIST2ARRAY',
                            this.getIdentifier(),
                            this.ruleFor,
                            data.getIdentifier()
                        );
                    }
                }
            }
            return outdata;
        } else {
            outdata = this.inputlocation?.getInputValue(data) as string;

            if (this.formula !== null) {
                const formuladata = outdata;
                outdata = this.formula.replace(outdata);
                if (
                    this.getDataType() !== DataType.List2Array &&
                    outdata === ''
                ) {
                    putConsoleErrorMsg(
                        'FORMULA_UNMATCH_REGEXP',
                        this.getIdentifier(),
                        this.ruleFor,
                        data.getIdentifier()
                    );
                } else if (outdata === undefined) {
                    putConsoleErrorMsg(
                        'FORMULA_FAIL_LIST2ARRAY',
                        this.getIdentifier(),
                        this.ruleFor,
                        data.getIdentifier(),
                        formuladata
                    );
                }
            }
            return outdata;
        }
    }

    /**
     * Get the object hierarchy information that is the output position
     * @returns Object hierarchy information that is the output position
     */
    getOutputLocation(): string[] {
        return this.outputlocation!.getLocation();
    }

    /**
     * Get the output key name
     * @returns Output key name
     */
    getOutputKey(): string {
        return this.outputlocation!.getKey();
    }

    /**
     * Get the information of the Default value of the output schema
     * @returns Information on the Default value of the output schema
     */
    getDefaultValues(): DefaultValue[] {
        return this.defaultValues;
    }

    /**
     * Returns the output type of Default value
     * @description Set in the constructor. Returns one of'emptyObject','emptyArray', or'string'.
     * @returns Default value output data
     */
    getDataType(): string {
        return this.dataType;
    }

    /**
     * Returns the identifier of the data
     * @returns Data identifier string
     */
    getIdentifier(): string {
        return this.csvLineObj[this.identifierColumnName];
    }
}

/**
 * A class that manages multiple RuleData (information on one conversion rule)
 */
export class ConvertRules {
    /**
     * Conversion rule header line identifier
     */
    static headerStr: string = convertRuleFile.header;
    /**
     *Array of headers
     */
    headerAry: string[] = [];
    /**
     * An array of valid conversion rules for class
     */
    rulesForClass: RuleData[] = [];
    /**
     * An array of valid conversion rules for property
     */
    rulesForProperty: RuleData[] = [];
    /**
     * Number of conversion rules read
     */
    numCapturedRules: number = 0;

    /**
     * Create a class instance that holds row-by-line information.
     * @description The generated row-by-line instance is stored in rulesForClass or rulesForproperty.
     * @param csvStr Stringized csv data (result of reading csv file)
     * @param headerLineStr A string that identifies the header line
     */
    private generateByCSVString = (
        csvStr: string,
        headerLineStr: string
    ): void => {
        // parse csv
        const parsedCsv = jCsv.toArrays(csvStr);

        // Get heading line
        const headerAry = parsedCsv.find(
            // The line where headerLineStr and the first column match is treated as a heading line.
            (element: string[]) => element[0] === headerLineStr
        );
        if (headerAry === undefined) {
            const msg = getMsg('EXCEPTION_RULES_NOHEADER', headerLineStr);
            throw new Error(msg);
        } else {
            /**
             * By handling the column names of files 2 and 4 in all lowercase letters,
             * the "case insensitive" of the rule definition MM1 elemnt and MM1 model is absorbed.
             */
            this.headerAry = headerAry.map((str: string) => {
                return str.toLowerCase();
            });
        }

        // Create objects with heading rows as keys for the number of data rows
        for (let n = 0; n < parsedCsv.length; n++) {
            const element = parsedCsv[n];
            if (element[0].indexOf(convertRuleFile.ignoreLine) !== 0) {
                this.numCapturedRules += 1;
                const ruledata = new RuleData(this.headerAry, element);
                if (ruledata.csvLineObj[ColumnName.mm1model] === 'class') {
                    this.rulesForClass.push(ruledata);
                } else {
                    // if ( obj.csvLineObj[ColumnName.mm1model] === 'property') {
                    this.rulesForProperty.push(ruledata);
                }
            }
        }
    };

    /**
     * constructor
     * @description Generate a ConvertRules class object from the result of reading the conversion rule file.
     * @param csvStr Stringized csv data (result of reading csv file)
     * @param classHeader IEC CDD (class) heading line information
     * @param propertyHeader IEC CDD (property) heading line information
     */
    constructor(
        csvStr: string,
        classHeader: string[],
        propertyHeader: string[]
    ) {
        this.generateByCSVString(csvStr, ConvertRules.headerStr);

        // Update conversion rule information by checking consistency with ICE CDD heading line.
        // A rule that detects a problem with integrity is an invalid rule.
        this.checkClassRuleWithHeader(classHeader);
        this.checkPropertyRuleWithHeader(propertyHeader);
    }

    /**
     * Returns whether all conversion rules are valid.
     * @description Returns the result of comparing the number of loaded rules with the number of valid rules.
     * @returns Number of rules read == true if the number of valid rules. Otherwise false is returned.
     */
    isAllRulesValid(): boolean {
        if (
            this.numCapturedRules ===
            this.rulesForClass.length + this.rulesForProperty.length
        ) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Returns a valid conversion rule for class.
     * @returns Array of rules for class
     */
    getForClassRules(): RuleData[] {
        return this.rulesForClass;
    }

    /**
     * Returns a valid conversion rule for property.
     * @returns Array of rules for property
     */
    getForPropertyRules(): RuleData[] {
        return this.rulesForProperty;
    }

    /**
     * Check the rules for class for inconsistencies with the IEC CDD heading information and update the information on whether each conversion rule is valid or not.
     * @param cHeader IEC CDD (class) heading line information
     */
    private checkClassRuleWithHeader(cHeader: string[]) {
        for (const element of this.getForClassRules()) {
            if (!element.checkWithHeader(cHeader)) {
                element.validRule = false;
            }
        }
        this.rulesForClass = this.rulesForClass.filter((element: RuleData) => {
            return element.isValid() === true;
        });
    }

    /**
     * Check the rules for property for inconsistencies with the IEC CDD heading information and update the information on whether each conversion rule is valid or not.
     * @param pHeader IEC CDD (class) heading line information
     */
    private checkPropertyRuleWithHeader(pHeader: string[]) {
        for (const element of this.getForPropertyRules()) {
            if (!element.checkWithHeader(pHeader)) {
                element.validRule = false;
            }
        }
        this.rulesForProperty = this.rulesForProperty.filter(
            (element: RuleData) => {
                return element.isValid() === true;
            }
        );
    }
}
