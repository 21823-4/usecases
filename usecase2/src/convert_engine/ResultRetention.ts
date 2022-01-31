/*
 * Copyright (C) 2021 TOSHIBA Corporation.
 * SPDX-License-Identifier: MIT
 */
import { DataType } from './const';
import { getMsg, putConsoleErrorMsg } from './messages';
import * as util from './util';

/**
 * Class that holds update data and output result data
 */
export class ResultRetention {
    /**
     * String template JSON data
     */
    contents: string;
    /**
     * Data added to the update data
     */
    savedSetData: Array<any> = [];
    /**
     * Data for update
     */
    temporaryData: any = {};
    /**
     * Data whose output is confirmed (data with no problem in conversion and validation)
     */
    private confirmedData: any = {};

    /**
     * constructor
     * @param contents Template JSON data converted into a character string (result of reading the template JSON file)
     */
    constructor(contents: string) {
        this.contents = contents;
        try {
            this.temporaryData = JSON.parse(contents);
            this.confirmedData = JSON.parse(contents);
        } catch (e) {
            const msg = getMsg(
                'EXCEPTION_PARSE_TEMPLATE',
                (e as Error).message
            );
            throw new Error(msg);
        }
    }

    /**
     * Output to update data.
     * @description When the output is successful, the argument at the time of output request is stored in savedSetData. This is the output information for the data whose output is confirmed.
     * @param loc An array of object hierarchies that will be the output position
     * @param key Key name to output data. If key is an empty string, only the object hierarchy of loc is generated and value is not set.
     * @param value Value of data to be added. If type is'empryObject','emptyArray', it is not referenced.
     * @param type Type of data to add. One of'string','list2array','empryObject','emptyArray'.
     * @param identifier Rule identifier to be processed
     * @returns Did the output succeed? True if successful, false if unsuccessful.
     */
    setData(
        loc: string[],
        key: string,
        value: any,
        type: string,
        identifier: string
    ): boolean {
        const ret = this.update(
            this.temporaryData,
            loc,
            key,
            value,
            type,
            identifier
        );
        if (ret) {
            // When the output is successful, 
            // the argument requested for output is retained as update information for the data whose output is confirmed.
            this.savedSetData.push({
                loc: loc,
                key: key,
                value: value,
                type: type,
                identifier: identifier,
            });
        }
        return ret;
    }

    /**
     * Add data to the object.
     * @param object Object to which data is added
     * @param loc An array of object hierarchies that will be the output position
     * @param key Key name to output data. If key is an empty string, only the object hierarchy of loc is generated and value is not set.
     * @param value Value of data to be added. If type is'empryObject','emptyArray', it is not referenced.
     * @param type Type of data to add. One of'string','list2array','empryObject','emptyArray'.
     * @param identifier Rule identifier to be processed
     * @returns Was the data addition successful? True if successful, false if unsuccessful.
     */
    private update(
        object: any,
        loc: string[],
        key: string,
        value: any,
        type: string,
        identifier: string
    ): boolean {
        /*
         * [ before ]
         *     object = {}
         *     loc = ["AAA","BBB","CCC","DDD"]
         *     key = 'KEY"
         *     value = "data"
         *
         * [ after ]
         *     object = {
         *         "AAA" : {
         *             "BBB" : {
         *                 "CCC" : {
         *                     "DDD" : {
         *                         KEY :  data
         *                     }
         *                 }
         *             }
         *         }
         *     }
         */

        // Follow loc to find an object that outputs key and value
        let place: any = object;
        for (let i = 0; i < loc.length; i++) {
            const objkey = loc[i];

            if (objkey.endsWith('[]')) {
                const objkeyName = objkey.replace('[]', '');
                if (place[objkeyName] === undefined) {
                    place[objkeyName] = [];
                }
                // If keyname [] is specified, but the keyname is not an array, it cannot be output.
                if (!Array.isArray(place[objkeyName])) {
                    putConsoleErrorMsg(
                        'INCONSISTENCY_DESTINATION_NO_ARRAY',
                        identifier,
                        objkeyName
                    );
                    return false;
                }
                place[objkeyName].push({});
                place = place[objkeyName][place[objkeyName].length - 1];
            } else if (objkey.endsWith('[-1]')) {
                const objkeyName = objkey.replace('[-1]', '');
                // If keyname [-1] is specified, but keyname is not an array, it cannot be output.
                if (
                    !Array.isArray(place[objkeyName]) ||
                    place[objkeyName].length < 1
                ) {
                    putConsoleErrorMsg(
                        'INCONSISTENCY_DESTINATION_NO_ARRAY_OR_EMTTY',
                        identifier,
                        objkeyName
                    );
                    return false;
                }
                place = place[objkeyName][place[objkeyName].length - 1];
            } else {
                if (place[objkey] === undefined) {
                    place[objkey] = {};
                }
                place = place[objkey];
            }
        }
        // If the key is an empty string, only the loc object hierarchy is generated and the value is not set.
        if (util.isExist(key)) {
            if (type === DataType.String) {
                place[key] = value;
            } else if (type === DataType.EmptyObject) {
                place[key] = {};
            } else if (type === DataType.EmptyArray) {
                place[key] = [];
            } else if (type === DataType.List2Array) {
                if (util.isExist(value)) {
                    const matchret = value.match(/^{(.*)}$/);
                    if (matchret == null || matchret.length !== 2) {
                        // Since it has already been checked, it will be a Logical Error.
                        const msg = getMsg(
                            'EXCEPTION_LOGICAL_ERROR',
                            util.getStack()
                        );
                        throw new Error(msg);
                    }
                    place[key] = matchret[1].split(',').map((e: string) => {
                        return e.trim();
                    });
                } else {
                    place[key] = [];
                }
            } else {
                const msg = getMsg('EXCEPTION_LOGICAL_ERROR', util.getStack());
                throw new Error(msg);
            }
        }

        return true;
    }

    /**
     * Returns update data.
     * @returns Data for update
     */
    getTemporary(): any {
        return this.temporaryData;
    }

    /**
     * Returns data with confirmed output
     * @returns Confirmed data (confirmeed data)
     */
    getConfirmed(): any {
        return this.confirmedData;
    }

    /**
     * The information output to the update data is reflected in the output confirmed data.
     * @description After the output is reflected in the confirmed data, the update data is initialized.
     */
    confirme() {
        for (const data of this.savedSetData) {
            this.update(
                this.confirmedData,
                data.loc,
                data.key,
                data.value,
                data.type,
                data.identifier
            );
        }
        this.initTemporary();
    }

    /**
     * Initialize the update data.
     * @description Make the update data the template data and clear the information of the added data.
     */
    initTemporary() {
        this.temporaryData = JSON.parse(this.contents);
        this.savedSetData = [];
    }
}
