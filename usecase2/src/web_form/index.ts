/*
 * Copyright (C) 2021 TOSHIBA Corporation.
 * SPDX-License-Identifier: MIT
 */

/**
 *Web app UI
 */
import { ConvertResult, cddconvert } from '../convert_engine/cddconvert';
import * as util from '../convert_engine/util';
import { ConfigFileKeyword } from '../convert_engine/const';

import $ from 'jquery';
import 'jstree';
import 'jstree/dist/themes/default/style.min.css';

require('./styles.css');

/**
 * Input and output file names
 */
const configFilename = 'config.json'; // file settings JSON name
const resultFilename = 'result.json'; // File name of the conversion result to download
const errorDetailsFilename = 'errorDetails.txt'; // File name of the Error Details to download

/**
 * Check if your browser supports the File API.
 */
if (window.File && window.FileReader && window.FileList && window.Blob) {
    // alert('Your browser support the FileAPI.');
} else {
    alert('Your browser does not support the FileAPI and will not work.');
}

/**
 * HTML Element
 */
const file1Div = <HTMLDivElement>document.getElementById('cdd_metamodel');
const file2cDiv = <HTMLDivElement>document.getElementById('iec_cdd_class');
const file2pDiv = <HTMLDivElement>document.getElementById('iec_cdd_prop');
const file3Div = <HTMLDivElement>document.getElementById('aas_metamodel');
const file4Div = <HTMLDivElement>document.getElementById('convert_rule');
const messageArea = <HTMLDivElement>document.getElementById('message_area');
const btnConvert = <HTMLButtonElement>document.getElementById('convert');
const btnDownload = <HTMLButtonElement>document.getElementById('download');
const divDownloadErrorDetails = <HTMLDivElement>(
    document.getElementById('download_errordetails')
);

/**
 * Screen Controls
 */
let validConvert: boolean = false; // Control of enable/disable of convert button
let validDownload: boolean = false; // Control of enable/disable of download button
let convertedData: any = null; // converted JSON data.
let message: string = ''; // string output to message area.
let errorDetails: string[]; // Error Details of convert.

/**
 * Create an Anchor Element.
 * @param path Path to link
 * @returns Anchor Element
 */
const createAElement = (path: string): HTMLAnchorElement => {
    const aElement = document.createElement('a');
    aElement.href = path;
    aElement.innerHTML = path;
    return aElement;
};

/**
 * Output a success message.
 * @param message message
 */
const successMessage = (message: string): void => {
    messageArea.setAttribute('style', 'color:blue');
    messageArea.innerText = message;
};

/**
 * Output a failure message.
 * @param message message
 */
const errorMessage = (message: string): void => {
    messageArea.setAttribute('style', 'color:red');
    messageArea.innerText = message;
};

/**
 * Clear the message.
 */
const clearMessage = (): void => {
    messageArea.innerText = '';
};

/**
 * Enable / disable the button.
 * @param btn Button Element
 * @param valid True to enable the button, false to disable it
 */
const ableButton = (btn: HTMLButtonElement, valid: boolean): void => {
    if (valid) {
        btn.removeAttribute('disabled');
    } else {
        btn.setAttribute('disabled', 'disabled');
    }
};

/**
 * Create an object for jstree output from the object.
 * @param data The underlying data of the object for jstree output
 * @returns Object for jstree output
 */
const buildListData = (data: any): any => {
    const resultData = [];
    for (const item in data) {
        if (typeof data[item] === 'object') {
            const child = buildListData(data[item]);
            resultData.push({
                text: `${item}`,
                children: child,
            });
        } else {
            resultData.push({
                text: `${item}:${data[item]}`,
                icon: 'jstree-file',
            });
        }
    }
    return resultData;
};

/**
 * Tree data
 */
let listingData: any = [];

/**
 * Create data for jsTree callback
 * @param node node
 * @returns Child node data
 */
const makeTreeData = (node: any): any => {
    let data: any;
    if (node.original && node.original.actualData) {
        data = node.original.actualData;
    } else {
        data = listingData;
    }
    const treeData: any[] = [];
    for (const iter of data) {
        const item: any = { text: iter.text };
        if (iter.children) {
            item.children = true;
            item.actualData = iter.children;
        } else {
            item.icon = 'jstree-file';
        }
        treeData.push(item);
    }
    return treeData;
};
/**
 * jsTree callback function
 * @param obj Data
 * @param cb Callback
 */
const getTree = (obj: any, cb: any) => {
    const data = makeTreeData(obj);
    cb.call(this, data);
};

/**
 * Click event processing for the "Convert" button.
 */
btnConvert.addEventListener(
    'click',
    (e) => {
        (async () => {
            // disable convert/download button.
            ableButton(btnConvert, false);
            ableButton(btnDownload, false);

            // clear message area
            clearMessage();
            divDownloadErrorDetails.innerText = '';

            // clear tree area
            $('#tree_area').empty();
            $('#tree_area').removeClass();

            let valid: boolean;
            try {
                // cddconvert returns JSON-string.
                const result: ConvertResult = (await cddconvert(
                    configFilename
                )) as ConvertResult;

                convertedData = result.resultData;
                errorDetails = result.errorDetails;
                message = result.messageStrings.join('\n');
                valid = result.valid;
            } catch (e) {
                message = (e as Error).message;
                console.error(message);
                convertedData = null;
                errorDetails = [];
                valid = false;
            }

            if (convertedData) {
                validDownload = true;
                try {
                    // output converted result to div(#tree_area).
                    listingData = buildListData(convertedData);
                    $('#tree_area').jstree({
                        core: {
                            data: getTree, // Callback is faster because it is read each time the node is expanded.
                            worker: false, // If you attach this, the time of the Loading icon will be shortened, so it will be faster.
                        },
                    });
                    $('#tree_area').show();
                } catch (e) {
                    const emsg = (e as Error).message;
                    console.error(emsg);
                    const listingError = `Exception occurred in the tree display of the conversion result. (${emsg})`;
                    if (message === '') {
                        message = listingError;
                    } else {
                        message = [message, listingError].join('\n');
                    }
                    valid = false;
                }
            } else {
                validDownload = false;
                // hidden div as converted result.
                $('#tree_area').hide();
            }
            if (valid) {
                successMessage(message);
            } else {
                errorMessage(message);
                if (errorDetails.length > 0) {
                    divDownloadErrorDetails.innerText =
                        'Download Error Details';
                }
            }

            // enable/disable download button.
            ableButton(btnDownload, validDownload);

            // enable convert button.
            ableButton(btnConvert, true);
        })();
    },
    false
);

/**
 * Click event processing for the "Download" button.
 */
btnDownload.addEventListener(
    'click',
    (e) => {
        if (validDownload && convertedData !== null) {
            const resultStr = JSON.stringify(convertedData, null, '\t');
            const blob = new Blob([resultStr], { type: 'text/json' });
            const url = URL.createObjectURL(blob);
            const aelm = document.createElement('a');
            document.body.appendChild(aelm);
            aelm.download = resultFilename;
            aelm.href = url;
            aelm.click();
            aelm.remove();
            URL.revokeObjectURL(url);
        } else {
            alert('Cannot download because conversion is not complete.');
        }
    },
    false
);

divDownloadErrorDetails.addEventListener(
    'click',
    (e) => {
        if (errorDetails.length !== 0) {
            const downloadStr = errorDetails.join('\n');
            const blob = new Blob([downloadStr], { type: 'text' });
            const url = URL.createObjectURL(blob);
            const aelm = document.createElement('a');
            document.body.appendChild(aelm);
            aelm.download = errorDetailsFilename;
            aelm.href = url;
            aelm.click();
            aelm.remove();
            URL.revokeObjectURL(url);
        } else {
            alert('Cannot download Error Details because no details.');
        }
    },
    false
);

// jstree : Toggle_node with a single click
$('#tree_area')
    .on('click', '.jstree-anchor', function (e) {
        $(this).jstree(true).toggle_node(e.target);
    })
    .jstree();

(async () => {
    // Read the JSON of the input definition.
    // Generates Anchor Element for the specified file.
    try {
        const configStr = (await util.promiseReadFile(
            configFilename
        )) as string;
        const configJson = JSON.parse(configStr);
        if (
            ConfigFileKeyword.cddMetamodelFile in configJson &&
            ConfigFileKeyword.modelDataFileC in configJson &&
            ConfigFileKeyword.modelDataFileP in configJson &&
            ConfigFileKeyword.schemaFile in configJson &&
            ConfigFileKeyword.convertRuleFile in configJson &&
            ConfigFileKeyword.templateFile in configJson
        ) {
            file1Div.appendChild(createAElement(configJson.File1));
            file2cDiv.appendChild(createAElement(configJson.File2class));
            file2pDiv.appendChild(createAElement(configJson.File2property));
            file3Div.appendChild(createAElement(configJson.File3));
            file4Div.appendChild(createAElement(configJson.File4));
            validConvert = true;
        } else {
            errorMessage('Expected key does not exist in config file.');
            validConvert = false;
        }
    } catch (e) {
        console.error((e as Error).message);
        errorMessage((e as Error).message);
        validConvert = false;
    }

    // enable/disable setting of convert button.
    ableButton(btnConvert, validConvert);
})();

// disable setting of download button.
ableButton(btnDownload, false);
