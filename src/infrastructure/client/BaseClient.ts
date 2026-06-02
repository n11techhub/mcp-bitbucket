import winston from "winston";
import axios, {AxiosInstance} from "axios";
import {injectable, inject} from "inversify";
import {Types} from "../../application/Types.js";
import type {Configuration} from "../configuration/Configuration.js";

@injectable()
export class BaseClient {
    protected readonly logger: winston.Logger;
    protected readonly api: AxiosInstance;

    constructor(
        @inject(Types.Configuration) config: Configuration,
        @inject(Types.Logger) logger: winston.Logger
    ) {
        this.logger = logger;
        this.api = axios.create({
            baseURL: `${config.baseUrl}/rest/api/1.0`,
            headers: config.token
                ? {Authorization: `Bearer ${config.token}`}
                : {},
            auth: config.username && config.password
                ? {username: config.username, password: config.password}
                : undefined,
        });
    }
}
