import { Module, ServiceContainer, ZumitoFramework } from "zumito-framework";
import { LogData } from "./definitions/LogData";
import { LogManager } from "./services/LogManager";
import { Client } from "zumito-framework/discord";

export class LoggerModule extends Module {
    constructor(modulePath: string, framework: ZumitoFramework) {
        super(modulePath);

        ServiceContainer.addService(LogManager, [Client.name, ZumitoFramework.name]);
    }
}

export {
    LogData,
    LogManager
};