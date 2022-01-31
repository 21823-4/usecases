/*
 * Copyright (C) 2021 TOSHIBA Corporation.
 * SPDX-License-Identifier: MIT
 */

/**
 * Read the file with XMLHttpRequest
 * @param {string} inputFile imput file name
 * @returns Input file contents or exceptions
 */
export const promiseReadFile = (
    inputFile: string
): Promise<string | DOMException> => {
    const req = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
        req.open('get', inputFile, true);
        req.setRequestHeader('Pragma', 'no-cache');
        req.setRequestHeader('Cache-Control', 'no-cach');
        req.onerror = () => {
            reject(new DOMException(`Failed to read the file. (${inputFile})`));
        };
        req.onload = () => {
            if (req.readyState === 4 && req.status === 200) {
                resolve(req.responseText as string);
            } else {
                reject(
                    new DOMException(
                        `Failed to read the file. (${inputFile}, ${req.statusText})`
                    )
                );
            }
        };
        req.send(null);
    });
};

/**
 * Check if the character string is valid as data.
 * @description Returns true if string and non-empty string, false otherwise.
 * @param str Character string to be checked
 * @returns Returns true if string and non-empty string, false otherwise
 */
export const isExist = (str: string | undefined): boolean => {
    if (typeof str === 'string' && str !== '') {
        return true;
    }
    return false;
};

/**
 * Remove the double quotes from the string imported from Excel.
 * @param excelstr Character string imported from Excel
 * @returns String with unnecessary double quotes removed
 */
export const importExcelString = (str: string): string => {
    if (/^"/.test(str) && /^"/.test(str)) {
        return str.replace(/^"/g, '').replace(/"$/g, '').replace(/""/g, '"');
    }
    return str;
};

/**
 * Remove quotes before and after the string.
 * @param excelstr Character string to be processed
 * @returns String with leading and trailing quotes removed
 */
export const replaceWrapQuarts = (str: string): string => {
    if (/^"/.test(str) && /"$/.test(str)) {
        return str.replace(/^"/g, '').replace(/"$/g, '');
    } else if (/^'/.test(str) && /'$/.test(str)) {
        return str.replace(/^'/g, '').replace(/'$/g, '');
    } else {
        return str;
    }
};

/**
 * Returns a stack trace string.
 * @returns Stack trace string. If acquisition fails, the default string is returned.
 */
export const getStack = (): string => {
    const e = new Error();
    if (e.stack === undefined) {
        return 'Failed to get stack ';
    } else {
        return e.stack.toString();
    }
};
