/*
 * Copyright (C) 2021 TOSHIBA Corporation.
 * SPDX-License-Identifier: MIT
 */
package jp.co.toshiba.rdc.modelconverter.extractor;

import java.io.BufferedOutputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.io.PrintStream;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.eclipse.emf.common.util.EList;
import org.eclipse.emf.ecore.EClass;
import org.eclipse.emf.ecore.EObject;
import org.eclipse.emf.ecore.EReference;
import org.eclipse.emf.ecore.EStructuralFeature;
import org.eclipse.m2m.atl.core.ATLCoreException;
import org.eclipse.m2m.atl.core.IExtractor;
import org.eclipse.m2m.atl.core.IModel;
import org.eclipse.m2m.atl.core.emf.EMFModel;


public class JsonExtractor implements IExtractor {

	public void extract(IModel sourceModel, String target)
			throws ATLCoreException {
		extract(sourceModel, target, Collections.<String, Object> emptyMap());
	}

	public void extract(
			IModel sourceModel, String target,
			Map<String, Object> options) throws ATLCoreException {
		try {
			String formattedTarget = target;
			if (target.startsWith("file:"))
				formattedTarget = target.substring(target.indexOf(":") + 2);
			OutputStream out = new FileOutputStream(formattedTarget);
			extract(sourceModel, out, options);
		} catch (FileNotFoundException e) {
			e.printStackTrace();
		}
	}

	public void extract(
			IModel sourceModel, OutputStream target,
			Map<String, Object> options) throws ATLCoreException {
		PrintStream outStream = new PrintStream(
				new BufferedOutputStream(target));
		outStream.println("{");

		EMFModel xmlModel = (EMFModel) sourceModel;

		EClass rootClass = (EClass) xmlModel.getReferenceModel()
				.getMetaElementByName("Root");
		Set<EObject> rootElements = xmlModel.getElementsByType(rootClass);
		for (EObject rootElement : rootElements) {
			serializeContent(
					rootElement, xmlModel, outStream,
					"  ");
		}
		outStream.println();
		outStream.print("}");
		outStream.close();
	}

	private void serializeContent(
			EObject xmlModelElement, EMFModel xmlModel,
			PrintStream outStream, String indent) {
		EList<EStructuralFeature> eStructuralFeatures = xmlModelElement.eClass().getEAllStructuralFeatures();
		boolean isFirst = true;
		for (EStructuralFeature sf : eStructuralFeatures) {
			Object obj = xmlModelElement.eGet(sf);
			if (obj == null)
				continue;
			List<Object> children;
			boolean isArray = false;
			if (obj instanceof EList) {
				children = (EList) obj;
				isArray = true;
			} else {
				children = Collections.singletonList(obj);
			}
			if (!isFirst) {
				outStream.println(",");
			}
			isFirst = false;
			outStream.print(indent + "\"" + sf.getName() + "\":");
			if(isArray) {
				outStream.print("[");
			}
			boolean isArrayFirst = true;
			for (Object child : children) {
				if (sf instanceof EReference) {
					outStream.println(" {");
					serializeContent(
							(EObject)child, xmlModel, outStream,
							indent + "  ");
					outStream.println();
					outStream.print(indent + "}");
				} else {
					if(!isArrayFirst) {
						outStream.print(",");
					}
					isArrayFirst = false;
					if(sf.getEType().getName().equals("number")) {
						outStream.print(child);
					}else {
						outStream.print("\"" + child + "\"");
					}
				}
			}
			if(isArray) {
				outStream.print("]");
			}
		}
	}
}
