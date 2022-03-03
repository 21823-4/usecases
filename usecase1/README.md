# Usecase1: Data conversion from ISO vehicle prove data to FIWARE

# Description
This tool is a use case implementation of ISO/IEC 21823-4. 
In this use case, we implement a tool that converts IoT System1 using ISO 22837 
and ISO 14817 vehicle probe data to IoT System2 using [FIWARE DATA MODEL](https://fiware-datamodels.readthedocs.io/en/latest/index.html) according to ISO/IEC 21823-4.
Via information exchange rules between Metamodel1 (vehicle prove data) and Metamodel2 (FIWARE),
Model1 can be automatically converted to Model2 complying to Metamodel2. 

# Installation
## Prerequisite
Open JDK (Java Development Kit) 11 and Gradle need to be pre-installed. 
For Windows, you can download the installer from https://adoptium.net/index.html?variant=openjdk11 and https://gradle.org/.
The operation in the following environment has been confirmed.
- Windows 10
- Eclipse Termurin JDK with Hotspot 11.0.13+8 (x64)
- Gradle 5.4

## Download
From https://github.com/21823-4/usecases ,click "Code" in the upper right corner of the screen and download the file from "Download ZIP".
If Git is installed, you can also download it by using clone with the following command.

```
git clone https://github.com/21823-4/usecases.git
```

## Installing dependent modules and Building project
Run the following command in the iso-iec-21823-4\usecase1 directory.
```
gradle build
```

If successful, you will see a message similar to the following:<br>
BUILD SUCCESSFUL in (xxx) s

Verify that the "build" directory has been generated after the build, and the "libs" directory has been generated in the "build" directory,
and the "jp.co.toshiba.rdc.modelconverter.jar" has been generated in the "build/libs" directory.

# Usage
```
java -jar .\build\libs\jp.co.toshiba.rdc.modelconverter.jar
```

After executing the program with the above command, two output files: outFIWARE.json and Probe2FIWARE.asm will be generated under the "usecase1" directory. 

# Source Tree

```
usecase1
├─input_data
│   ├─Fiware.ecore                // FIWARE data model file in ecore format
│   ├─M-Vehicle.xmi               // ISO 22837_2009 vehicle probe data file in xmi format
│   ├─ProbeVehicle.ecore          // ISO 22837_2009 vehicle probe data model file in ecore format
│   └─Probe2Fiware.atl            // transfomartion rule file in ATL format
├─output_data
│   ├─outFIWARE.json              // output file sample
│   └─Probe2FIWARE.asm            // temporary file 
└─src/main/java/jp/co/toshiba/rdc/modelconverter
    ├─core
    │  └─AtlLauncherService.java    // ATL transfomartion service
    ├─extractor
    │  └─JsonExtractor.java         // JSON format extractor
    └─main
        └─Probe2Fiware.java          // main class

```
