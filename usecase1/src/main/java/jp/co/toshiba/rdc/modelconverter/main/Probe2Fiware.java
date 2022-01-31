/*
 * Copyright (C) 2021 TOSHIBA Corporation.
 * SPDX-License-Identifier: MIT
 */
package jp.co.toshiba.rdc.modelconverter.main;

import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.net.URISyntaxException;

import org.eclipse.emf.ecore.EObject;
import org.eclipse.m2m.atl.core.ATLCoreException;
import org.eclipse.m2m.atl.core.IExtractor;
import org.eclipse.m2m.atl.core.IInjector;
import org.eclipse.m2m.atl.core.emf.EMFInjector;
import org.eclipse.m2m.atl.engine.compiler.AtlCompiler;

import jp.co.toshiba.rdc.modelconverter.core.AtlLauncherService;
import jp.co.toshiba.rdc.modelconverter.extractor.JsonExtractor;

public class Probe2Fiware {

	public static void main(String[] args) {
		try {
			new Probe2Fiware();
		} catch (IOException | URISyntaxException | ATLCoreException e) {
			e.printStackTrace();
		}
	}

	public Probe2Fiware() throws IOException, URISyntaxException, ATLCoreException{
	String currentPath = System.getProperty("user.dir") + "/input_data";
        String srcModelFilePath = currentPath + "/M-Vehicle.xmi";
        String srcMetaModelFilePath = currentPath + "/ProbeVehicle.ecore";
        String srcMetaModelName = "ProbeVehicle";
        String dstModelFilePath = System.getProperty("user.dir") + "/outFIWARE.json";
        String dstMetaModelFilePath = currentPath + "/Fiware.ecore";
        String dstMetaModelName = "Fiware";
        String atlFilePath = currentPath + "/Probe2Fiware.atl";
        String asmFilePath = System.getProperty("user.dir") + "/Probe2FIWARE.asm";

        IInjector injector = new EMFInjector();
        IExtractor jsonExtractor = new JsonExtractor();

        Reader input = new FileReader(atlFilePath);
        EObject[] results = AtlCompiler.compile(input, asmFilePath);
        for(EObject result: results) {
        	System.err.println(result);
        }
        AtlLauncherService.launch(
            srcModelFilePath, srcMetaModelFilePath, srcMetaModelName,
            dstModelFilePath, dstMetaModelFilePath, dstMetaModelName,
            asmFilePath, injector, jsonExtractor);
	}

}
