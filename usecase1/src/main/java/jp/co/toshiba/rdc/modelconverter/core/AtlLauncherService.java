/*
 * Copyright (C) 2021 TOSHIBA Corporation.
 * SPDX-License-Identifier: MIT
 */
package jp.co.toshiba.rdc.modelconverter.core;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashMap;

import org.eclipse.core.runtime.NullProgressMonitor;
import org.eclipse.m2m.atl.core.ATLCoreException;
import org.eclipse.m2m.atl.core.IExtractor;
import org.eclipse.m2m.atl.core.IInjector;
import org.eclipse.m2m.atl.core.IModel;
import org.eclipse.m2m.atl.core.IReferenceModel;
import org.eclipse.m2m.atl.core.ModelFactory;
import org.eclipse.m2m.atl.core.emf.EMFModel;
import org.eclipse.m2m.atl.core.emf.EMFModelFactory;
import org.eclipse.m2m.atl.core.emf.EMFReferenceModel;
import org.eclipse.m2m.atl.core.launch.ILauncher;
import org.eclipse.m2m.atl.engine.emfvm.launch.EMFVMLauncher;

/**
 * ATL変換を行う実行クラス
 *
 */
public class AtlLauncherService {
   /**
     * Transformation
     * @param srcModelFilePath
     * @param srcMetaModelFilePath
     * @param srcMetaModelName
     * @param dstModelFilePath
     * @param dstMetaModelFilePath
     * @param dstMetaModelName
     * @param asmFilePath
     * @throws URISyntaxException
     * @throws ATLCoreException
     * @throws FileNotFoundException
     */
    public static void launch(
        String srcModelFilePath, String srcMetaModelFilePath, String srcMetaModelName,
        String dstModelFilePath, String dstMetaModelFilePath, String dstMetaModelName,
        String asmFilePath, IInjector injector, IExtractor extractor
    )
        throws URISyntaxException, ATLCoreException, FileNotFoundException {

        String srcMetaModelFileUri = getUri(srcMetaModelFilePath);
        String dstMetaModelFileUri = getUri(dstMetaModelFilePath);
        String srcModelFileUri = getUri(srcModelFilePath);
        String dstModelFileUri = getUri(dstModelFilePath);

        /*
         * Initializations
         */
        ILauncher transformationLauncher = new EMFVMLauncher();
        ModelFactory modelFactory = new EMFModelFactory();

        /*
         * Load metamodels
         */
        IReferenceModel srcMetamodel = modelFactory.newReferenceModel();
        injector.inject(srcMetamodel, srcMetaModelFileUri);
        IReferenceModel dstMetamodel = modelFactory.newReferenceModel();
        injector.inject(dstMetamodel, dstMetaModelFileUri);

        /*
         * Run transformation
         */
        IModel srcModel = modelFactory.newModel(srcMetamodel);
        injector.inject(srcModel, srcModelFileUri);

        IModel dstModel = modelFactory.newModel(dstMetamodel);

        transformationLauncher.initialize(new HashMap<String, Object>());
        transformationLauncher.addInModel(srcModel, "IN", srcMetaModelName);
        transformationLauncher.addOutModel(dstModel, "OUT", dstMetaModelName);

        transformationLauncher.launch(
            ILauncher.RUN_MODE, new NullProgressMonitor(), new HashMap<String, Object>(),
            new FileInputStream(asmFilePath)
        );

        extractor.extract(dstModel, dstModelFileUri);

        /*
         * Unload all models and metamodels (EMF-specific)
         */
        EMFModelFactory emfModelFactory = (EMFModelFactory) modelFactory;
        emfModelFactory.unload((EMFModel) srcModel);
        emfModelFactory.unload((EMFModel) dstModel);
        emfModelFactory.unload((EMFReferenceModel) srcMetamodel);
        emfModelFactory.unload((EMFReferenceModel) dstMetamodel);
    }

    public static String getUri(String filePath) throws URISyntaxException {
        StringBuilder builder = new StringBuilder();
        builder.append("file:///");
        builder.append(filePath.replace('\\', '/'));
        String uri = builder.toString();
        new URI(uri); //parse check
        return uri;
    }

}
