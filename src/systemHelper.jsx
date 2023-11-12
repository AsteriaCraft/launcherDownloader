import { javaURLs } from "./config"

export const javaName = (system) => {
    switch (system.type){
        case "Windows_NT":
            return 'java-installer.msi'
        case "Darwin":
            return 'java-installer.pkg'
        case "Linux":
            return 'java-installer.deb'
    }
}

export const javaLink = (system) => {
    const archType = `${system.type}_${system.arch}`
    switch (archType){
        case "Windows_NT_x86_64":
            return javaURLs.winJava_x64
        case "Windows_NT_x86":
            return javaURLs.winJava_x32
        case "Windows_NT_aarch64":
            return javaURLs.winJava_ARMx64
        case "Windows_NT_arm":
            return javaURLs.winJava_ARMx32
        case "Darwin_x86_64":
            return javaURLs.macJava_x64
        case "Darwin_aarch64":
            return javaURLs.macJava_ARMx64
        case "Linux_x86_64":
            return javaURLs.linuxJava_x64
        case "Linux_x86":
            return javaURLs.linuxJava_x32
        case "Linux_aarch64":
            return javaURLs.linuxJava_ARMx64
        case "Linux_arm":
            return javaURLs.linuxJava_ARMx32
    }
}