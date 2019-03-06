import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { cleanFolder } from './fileutils';
import { createPlatformBuild } from './cli/platform';
import appRunner, { copyRuntimeAssets } from './cli/app';
import setupCLI from './cli/setup';
import {
    IOS, ANDROID, ANDROID_TV, ANDROID_WEAR, WEB, TIZEN, TVOS, WEBOS, MACOS, WINDOWS, TIZEN_WATCH, KAIOS,
    CLI_ANDROID_EMULATOR, CLI_ANDROID_ADB, CLI_TIZEN_EMULATOR, CLI_TIZEN, CLI_WEBOS_ARES, CLI_WEBOS_ARES_PACKAGE, CLI_WEBBOS_ARES_INSTALL, CLI_WEBBOS_ARES_LAUNCH,
    FORM_FACTOR_MOBILE, FORM_FACTOR_DESKTOP, FORM_FACTOR_WATCH, FORM_FACTOR_TV,
    ANDROID_SDK, ANDROID_NDK, TIZEN_SDK, WEBOS_SDK, KAIOS_SDK,
    RNV_PROJECT_CONFIG_NAME, RNV_GLOBAL_CONFIG_NAME, RNV_APP_CONFIG_NAME,
} from './constants';

const SUPPORTED_PLATFORMS = [IOS, ANDROID, ANDROID_TV, ANDROID_WEAR, WEB, TIZEN, TVOS, WEBOS, MACOS, WINDOWS, TIZEN_WATCH, KAIOS];
const SUPPORTED_PLATFORMS_MAC = [IOS, ANDROID, ANDROID_TV, ANDROID_WEAR, WEB, TIZEN, TVOS, WEBOS, MACOS, WINDOWS, TIZEN_WATCH];
const SUPPORTED_PLATFORMS_WIN = [ANDROID, ANDROID_TV, ANDROID_WEAR, WEB, TIZEN, TVOS, WEBOS, WINDOWS, TIZEN_WATCH];
const SUPPORTED_PLATFORMS_LINUX = [];
const RNV_START = '🚀 RNV';
const RNV = 'RNV';
const LINE = chalk.white.bold('----------------------------------------------------------');

let _currentJob;
let _currentProcess;
let _isInfoEnabled = false;
let _appConfigId;

const base = path.resolve('.');
const homedir = require('os').homedir();

const SDK_PLATFORMS = {};
SDK_PLATFORMS[ANDROID] = ANDROID_SDK;
SDK_PLATFORMS[ANDROID_TV] = ANDROID_SDK;
SDK_PLATFORMS[ANDROID_WEAR] = ANDROID_SDK;
SDK_PLATFORMS[TIZEN] = TIZEN_SDK;
SDK_PLATFORMS[TIZEN_WATCH] = TIZEN_SDK;
SDK_PLATFORMS[WEBOS] = WEBOS_SDK;
SDK_PLATFORMS[KAIOS] = KAIOS_SDK;


const isPlatformSupported = (platform, resolve, reject) => {
    if (!platform) {
        if (reject) reject(chalk.red(`You didn't specify platform. make sure you add "${chalk.white.bold('-p <PLATFORM>')}" option to your command!`));
        return false;
    }
    if (!SUPPORTED_PLATFORMS.includes(platform)) {
        if (reject) reject(chalk.red(`Platform ${platform} is not supported`));
        return false;
    }
    if (resolve) resolve();
    return true;
};


const checkAndConfigureRootProject = (cmd, subCmd, process, program) => new Promise((resolve, reject) => {
    _currentJob = cmd;

    _currentProcess = process;
    console.log(chalk.white(`\n${LINE}\n ${RNV_START} ${chalk.white.bold(`${_currentJob} ${subCmd || ''}`)} is firing up! 🔥\n${LINE}\n`));

    logTask(`checkAndConfigureRootProject:${cmd} ${subCmd}`);

    const configPath = path.join(base, RNV_PROJECT_CONFIG_NAME);

    if (fs.existsSync(configPath)) {
        resolve();
    } else {
        logWarning(`You're missing ${RNV_PROJECT_CONFIG_NAME} file in your root project! Let's create one!`);
        const newCommand = {};
        newCommand.command = 'bootstrap';
        setupCLI(newCommand).then(() => resolve()).catch(e => reject());
    }
});

const initializeBuilder = (cmd, subCmd, process, program) => new Promise((resolve, reject) => {
    _isInfoEnabled = program.info === true;
    _appConfigId = program.appConfigID;
    let c = { cli: {} };

    const platformAssetsFolder = path.join(base, 'platformAssets');
    const platformBuildsFolder = path.join(base, 'platformBuilds');
    const platformTemplatesFolder = path.join(__dirname, '../platformTemplates');
    const projectRootFolder = base;
    const rnvFolder = path.join(__dirname, '..');
    let globalConfigFolder;
    const configPath = path.join(base, RNV_PROJECT_CONFIG_NAME);

    c.program = program;
    c.process = process;
    c.platform = program.platform;
    c.command = cmd;
    c.projectRootFolder = projectRootFolder;
    c.rnvFolder = rnvFolder;
    c.homeFolder = homedir;
    c.subCommand = subCmd;

    const rootConfig = JSON.parse(fs.readFileSync(configPath).toString());

    if (rootConfig.globalConfigFolder.startsWith('~')) {
        globalConfigFolder = path.join(homedir, rootConfig.globalConfigFolder.substr(1));
    } else {
        globalConfigFolder = path.join(base, rootConfig.globalConfigFolder);
    }

    c.globalConfigFolder = globalConfigFolder;
    c.globalConfigPath = path.join(c.globalConfigFolder, RNV_GLOBAL_CONFIG_NAME);

    if (fs.existsSync(c.globalConfigPath)) {
        c.globalConfig = JSON.parse(fs.readFileSync(c.globalConfigPath).toString());

        c.cli[CLI_ANDROID_EMULATOR] = path.join(c.globalConfig.sdks.ANDROID_SDK, 'tools/emulator');
        c.cli[CLI_ANDROID_ADB] = path.join(c.globalConfig.sdks.ANDROID_SDK, 'platform-tools/adb');
        c.cli[CLI_TIZEN_EMULATOR] = path.join(c.globalConfig.sdks.TIZEN_SDK, 'tools/emulator/bin/em-cli');
        c.cli[CLI_TIZEN] = path.join(c.globalConfig.sdks.TIZEN_SDK, 'tools/ide/bin/tizen');
        c.cli[CLI_WEBOS_ARES] = path.join(c.globalConfig.sdks.WEBOS_SDK, 'CLI/bin/ares');
        c.cli[CLI_WEBOS_ARES_PACKAGE] = path.join(c.globalConfig.sdks.WEBOS_SDK, 'CLI/bin/ares-package');
        c.cli[CLI_WEBBOS_ARES_INSTALL] = path.join(c.globalConfig.sdks.WEBOS_SDK, 'CLI/bin/ares-install');
        c.cli[CLI_WEBBOS_ARES_LAUNCH] = path.join(c.globalConfig.sdks.WEBOS_SDK, 'CLI/bin/ares-launch');
    }


    if (_currentJob === 'setup' || _currentJob === 'init') {
        resolve(c);
        return;
    }

    let appConfigFolder;

    if (_appConfigId) {
        // App ID specified
        c = Object.assign(c, _getConfig(_appConfigId));

        // console.log(chalk.white(`\n${LINE}\n ${RNV_START} ${chalk.white.bold(_currentJob)} is firing up ${chalk.white.bold(c.appId)} 🔥\n${LINE}\n`));

        resolve(c);
    } else {
        // Use latest app from platfromAssets
        const appConfFilePath = path.join(base, 'platformAssets/config.json');
        if (!fs.existsSync(appConfFilePath)) {
            // console.log(chalk.white(`\n${LINE}\n ${RNV_START} ${chalk.white.bold(_currentJob)} is firing up! 🔥\n${LINE}\n`));
            logWarning('Seems like you\'re missing ./platformAssets/config.json file. But don\'t worry. RNV got you covered. Let\'s configure it for you!');

            c = Object.assign(c, _getConfig('helloWorld'));

            const newCommand = Object.assign({}, c);
            newCommand.subCommand = 'configure';
            newCommand.program = { appConfig: 'helloWorld', update: true };
            appRunner(newCommand).then(() => resolve(c)).catch(e => reject(e));
        } else {
            try {
                const assetConfig = JSON.parse(fs.readFileSync(appConfFilePath).toString());
                c = Object.assign(c, _getConfig(assetConfig.id));

                // console.log(chalk.white(`\n${LINE}\n ${RNV_START} ${chalk.white.bold(_currentJob)} is firing up ${chalk.white.bold(c.appId)} 🔥\n${LINE}\n`));
                resolve(c);
            } catch (e) {
                reject(e);
            }
        }
    }
});

const isSdkInstalled = (c, platform) => {
    logTask(`isSdkInstalled: ${platform}`);

    if (c.globalConfig) {
        const sdkPlatform = SDK_PLATFORMS[platform];
        if (sdkPlatform) return fs.existsSync(c.globalConfig.sdks[sdkPlatform]);
    }

    return false;
};

const checkSdk = (c, platform, reject) => {
    if (!isSdkInstalled(c, platform)) {
        reject(`${platform} requires SDK to be installed. check your ~/.rnv/config.json file if you SDK path is correct`);
        return false;
    }
    return true;
};


const logTask = (task) => {
    console.log(chalk.green(`\n${RNV} ${_currentJob} - ${task} - Starting!`));
};

const logWarning = (msg) => {
    console.log(chalk.yellow(`\n${RNV} ${_currentJob} - WARNING: ${msg}`));
};


const logDebug = (...args) => {
    if (_isInfoEnabled) console.log.apply(null, args);
};

const logComplete = (isEnd = false) => {
    console.log(chalk.white.bold(`\n ${RNV} ${_currentJob} - Done! 🚀`));
    if (isEnd) logEnd();
};

const logError = (e, isEnd = false) => {
    console.log(chalk.red.bold(`\n${RNV} ${_currentJob} - ERRROR! ${e}`));
    if (isEnd) logEnd();
};

const logEnd = () => {
    console.log(chalk.bold(`\n${LINE}\n`));
    _currentProcess.exit();
};

const _getConfig = (appConfigId) => {
    logTask(`_getConfig:${appConfigId}`);

    const c = JSON.parse(fs.readFileSync(path.join(base, RNV_PROJECT_CONFIG_NAME)).toString());
    const appConfigFolder = path.join(base, c.appConfigsFolder, appConfigId);
    const platformAssetsFolder = path.join(base, 'platformAssets');
    const platformBuildsFolder = path.join(base, 'platformBuilds');
    const platformTemplatesFolder = path.join(__dirname, '../platformTemplates');
    const appConfigPath = path.join(appConfigFolder, RNV_APP_CONFIG_NAME);
    const appConfigFile = JSON.parse(fs.readFileSync(appConfigPath).toString());

    return {
        rootConfig: c,
        appId: appConfigId,
        appConfigFile,
        appConfigPath,
        appConfigFolder,
        platformAssetsFolder,
        platformBuildsFolder,
        platformTemplatesFolder,
    };
};

const checkConfig = appId => new Promise((resolve, reject) => {
    const rootConfig = JSON.parse(fs.readFileSync(path.join(base, RNV_PROJECT_CONFIG_NAME)).toString());
    let cf;
    if (appId) {
        cf = path.join(base, RNV_PROJECT_CONFIG_NAME);
    }
    cf = path.join(base, 'platformAssets', RNV_APP_CONFIG_NAME);
    try {
        const c = JSON.parse(fs.readFileSync(cf).toString());
        resolve({
            rootConfig,
        });
    } catch (e) {
        resolve();
    }
});

const getAppFolder = (c, platform) => path.join(c.platformBuildsFolder, `${c.appId}_${platform}`);

const logErrorPlatform = (platform, resolve) => {
    console.log(`ERROR: Platform: ${chalk.bold(platform)} doesn't support command: ${chalk.bold(_currentJob)}`);
    resolve();
};

const isPlatformActive = (c, platform, resolve) => {
    if (!c.appConfigFile.platforms[platform]) {
        console.log(`Platform ${platform} not configured for ${c.appId}. skipping.`);
        resolve();
        return false;
    }
    return true;
};

const configureIfRequired = (c, platform) => new Promise((resolve, reject) => {
    logTask(`_configureIfRequired:${platform}`);

    if (!fs.existsSync(getAppFolder(c, platform))) {
        logWarning(`Looks like your app is not configured for ${platform}! Let's try to fix it!`);

        const newCommand = Object.assign({}, c);
        newCommand.subCommand = 'configure';
        newCommand.program = { appConfig: c.id, update: false };

        createPlatformBuild(c, platform)
            .then(() => appRunner(newCommand))
            .then(() => resolve(c))
            .catch(e => reject(e));
    } else {
        copyRuntimeAssets(c).then(() => resolve()).catch(e => reject(e));
    }
});

export {
    SUPPORTED_PLATFORMS, isPlatformSupported, getAppFolder, checkAndConfigureRootProject,
    logTask, logComplete, logError, initializeBuilder, logDebug, logErrorPlatform,
    isPlatformActive, isSdkInstalled, checkSdk, logEnd, logWarning, configureIfRequired,
    IOS, ANDROID, ANDROID_TV, ANDROID_WEAR, WEB, TIZEN, TVOS, WEBOS, MACOS, WINDOWS, TIZEN_WATCH,
    CLI_ANDROID_EMULATOR, CLI_ANDROID_ADB, CLI_TIZEN_EMULATOR, CLI_TIZEN, CLI_WEBOS_ARES, CLI_WEBOS_ARES_PACKAGE, CLI_WEBBOS_ARES_INSTALL, CLI_WEBBOS_ARES_LAUNCH,
    FORM_FACTOR_MOBILE, FORM_FACTOR_DESKTOP, FORM_FACTOR_WATCH, FORM_FACTOR_TV,
};