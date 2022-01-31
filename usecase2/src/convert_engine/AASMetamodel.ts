/*
 * Copyright (C) 2021 TOSHIBA Corporation.
 * SPDX-License-Identifier: MIT
 */
import Ajv2019, { Schema, ValidateFunction, Options } from 'ajv/dist/2019';
import { getMsg } from './messages';

/**
 * Ajv option
 */
const ajvOption = {
    // removeAdditional: 'all', // Comment out because the output is unintended
    allErrors: true, // Check all rules collecting all errors.
    coerceTypes: true, // Coercing data types
} as Options;

/**
 *  result of validation
 */
export interface ValidationResultIF {
    /**
     *  result of validation (true: if validation succeeds, false: if validation fails)
     */
    valid: boolean;
    /**
     * error message(null is when validation is success)
     */
    errorString: string | null;
}

/**
 * AAS meta model call
 */
export class AASMetamodel {
    /**
     * validation function from aas meta model.
     */
    validater: ValidateFunction;

    /**
     * constructor
     *
     * @param contents Stringized schema (JSON file read result)
     */
    constructor(contents: string) {
        let schema: Schema;
        try {
            schema = JSON.parse(contents);
        } catch (e) {
            const msg = getMsg(
                'EXCEPTION_PARSE_AASMETAMODEL',
                (e as Error).message
            );
            throw new Error(msg);
        }

        try {
            const ajv = new Ajv2019(ajvOption);
            this.validater = ajv.compile(schema);
        } catch (e) {
            const msg = getMsg(
                'EXCEPTION_COMPILE_AASMETAMODEL',
                (e as Error).message
            );
            throw new Error(msg);
        }
    }

    /**
     * Validate using ajv (Ajv2019)
     * @param jdata JSON data to be validated
     * @returns valid: result of validation. errorString: error message(null is when validation is success)
     */
    validate(jdata: any): ValidationResultIF {
        const valid = this.validater(jdata);
        if (!valid) {
            // validation error
            const errmsg = JSON.stringify(this.validater.errors);
            return { valid: false, errorString: errmsg };
        }
        return { valid: true, errorString: null };
    }
}
