/*
 * Copyright (C) 2021 TOSHIBA Corporation.
 * SPDX-License-Identifier: MIT
 */
import { getMsg } from './messages';
import * as util from './util';
import { ModelDataFile, ModelDataColName } from './const';

const jCsv = require('jquery-csv');

/**
 * A class that holds line-by-line information for CSV data
 *
 * This class is the base class of the class that holds the following information.
 * 
 * ClassData: Holds line-by-line information for IEC CDD (class)
 * PropertyData: Holds row-by-line information for IEC CDD (property)
 * 
 * */
export class CsvRowData {
    /**
     * Data that holds CSV row data.
     * @description It becomes the form. {Column name of heading row: Data, ...}
     */
    csvLineObj: any = {};

    /**
     * Column name that is the identifier of the data.
     * @description Column name to get the character string to identify which information at the time of error
     */
    identifierColumnName = ''; // Set in inherited class

    /**
     * constructor
     * @param header Array of column names in the heading row
     * @param data Array of data
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
    }

    /**
     * Returns the identifier of the data
     * @returns Data identifier string
     */
    getIdentifier(): string {
        return this.csvLineObj[this.identifierColumnName];
    }

    /**
     * Returns the data corresponding to the column name
     * @returns Data corresponding to the column name
     */
    getData(key: string): string {
        const ret = this.csvLineObj[key];
        if (ret === undefined) {
            // It is a prerequisite that the existing column name is specified.
            const msg = getMsg('EXCEPTION_LOGICAL_ERROR', util.getStack());
            throw new Error(msg);
        }
        return ret;
    }
}

/**
 * A class that manages line-by-line information for multiple CSV data.
 *
 * This class is the base class of the class that manages the following information.
 * 
 * IecCddClass : A class that manages multiple ClassData (row-by-line information of IEC CDD (class))
 * IecCddProp : Class that manages multiple PropertyData (row-by-line information of IEC CDD (property))
 * 
 */
export class IECCDDDataManagement {
    /**
     * Array of data elements in each row of CSV
     */
    manageData: any[] = [];

    /**
     * Array of columns that will be the heading row of CSV
     *
     * @description Each string is stripped of leading and trailing whitespace.
     */
    headerAry: string[] = [];

    /**
     * constructor
     * @param csvStr Stringized csv data (result of reading csv file)
     * @param headerStr A string to identify the heading line
     */
    constructor(csvStr: string, headerStr: string) {
        this.generateByCSVString(csvStr, headerStr);
    }

    /**
     * Returns heading line information.
     * @returns Array of columns that serve as heading rows
     */
    getHeader(): string[] {
        return this.headerAry;
    }

    /**
     * Returns an array of retained data.
     * @returns Array of retained data
     */
    getDatas(): any[] {
        return this.manageData;
    }

    /**
     * Returns the number of data held.
     * @returns Number of data held
     */
    getNumDatas(): number {
        return this.manageData.length;
    }

    /**
     * Create a class instance that holds row-by-line information.
     *
     * The processing content is implemented in the inherited class.
     * @param header Array of column names in the heading row
     * @param data Array of data
     */
    generateDataObject(header: Array<string>, data: Array<string>): any {
        throw new Error(
            `unexpected call IECCDDDataManagement.generateDataObject`
        );
    }

    /**
     * Create a class instance that holds row-by-line information.
     *
     * The generated row-by-row instance is stored in manageData.
     * @param csvStr Stringized csv data (result of reading csv file)
     * @param headerLineStr A string that identifies the heading line
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
            const msg = getMsg('EXCEPTION_IECCDD_NOHEADER', headerLineStr);
            throw new Error(msg);
        } else {
            /**
             * フAll column names in file 2 and file 4 are handled in lowercase.
             * This absorbs the "case insensitive" of the rule definition MM1 elemnt, MM1 model.
             * Also, the leading and trailing spaces are removed.
             */
            this.headerAry = headerAry.map((str: string) => {
                return str.trim().toLowerCase();
            });
        }

        // Create objects with heading rows as keys for the number of data rows
        this.manageData = parsedCsv
            .filter((element: string[]) => {
                // Rows whose first column starts with # are not treated as data rows.
                return element[0].indexOf(ModelDataFile.ignoreLine) !== 0;
            })
            .map((element: string[]) => {
                return this.generateDataObject(this.headerAry, element);
            });
    };
}

/**
 * A class that holds line-by-line information for IEC CDD (class)
 */
export class ClassData extends CsvRowData {
    /**
     * Column name that is the identifier of the data.
     */
    identifierColumnName = ModelDataColName.code.toLowerCase(); // Access to CSV data is lowercase, so keep it in lowercase.
}

/**
 * A class that holds line-by-line information for IEC CDD (property)
 */
export class PropertyData extends CsvRowData {
    /**
     * Column name that is the identifier of the data.
     */
    identifierColumnName = ModelDataColName.code.toLowerCase(); // Access to CSV data is lowercase, so keep it in lowercase.
}

/**
 * A class that manages multiple ClassData (row-by-line information of IEC CDD (class))
 */
export class IecCddClass extends IECCDDDataManagement {
    /**
     * A string to identify the heading line
     */
    static headerStr: string = ModelDataFile.header;

    /**
     * ClassData (row-by-line information of IEC CDD (class)) Create a class instance
     * @param header Array of column names in the heading row
     * @param data Array of data
     * @returns ClassData instance
     */
    generateDataObject(header: Array<string>, data: Array<string>): ClassData {
        return new ClassData(header, data);
    }

    /**
     * constructor
     * @description Create an IecCddClass class instance from the read result of the IEC CDD (class) file.
     * @param csvStr Stringized csv data (result of reading csv file)
     */
    constructor(csvStr: string) {
        super(csvStr, IecCddClass.headerStr);
    }
}

/**
 * Class that manages multiple PropertyData (row-by-line information of IEC CDD (property))
 */
export class IecCddProp extends IECCDDDataManagement {
    /**
     * A string to identify the heading line
     */
    static headerStr: string = ModelDataFile.header;

    /**
     * Create a PropertyData (IEC CDD (property) row-by-row information) class instance
     * @param header Array of column names in the heading row
     * @param data Array of data
     * @returns PropertyData instance
     */
    generateDataObject(
        header: Array<string>,
        data: Array<string>
    ): PropertyData {
        return new PropertyData(header, data);
    }

    /**
     * constructor
     * @description Create an IecCddProp class instance from the read result of the IEC CDD (Property) file.
     * @param csvStr Stringized csv data (result of reading csv file)
     */
    constructor(csvStr: string) {
        super(csvStr, IecCddProp.headerStr);
    }
}
