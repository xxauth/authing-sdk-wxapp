import {
  AuthenticationClientOptions,
  AuthenticationTokenProvider,
  ManagementClientOptions,
  ManagementTokenProvider,
} from "authing-sdk-js";
import { AxiosInstance, AxiosRequestConfig } from "axios";
import { VERSION } from "./version";
import Axios from "wx-axios";

export class HttpClient {
  options: ManagementClientOptions;
  tokenProvider: ManagementTokenProvider | AuthenticationTokenProvider;
  axios: AxiosInstance;

  constructor(
    options: ManagementClientOptions | AuthenticationClientOptions,
    tokenProvider: ManagementTokenProvider | AuthenticationTokenProvider
  ) {
    this.options = options;
    this.tokenProvider = tokenProvider;
    // @ts-ignore
    this.axios = Axios.create();
  }

  async request(config: AxiosRequestConfig) {
    const headers: any = {
      "x-authing-sdk-version": `wxapp:${VERSION}`,
      "x-authing-userpool-id": this.options.userPoolId,
      "x-authing-request-from": "wxapp",
      "x-authing-app-id": this.options.appId || "",
    };
    if (!(config && config.headers && config.headers.authorization)) {
      // 如果用户不传 token，就使用 sdk 自己维护的
      const token = await this.tokenProvider.getAccessToken();
      token && (headers.Authorization = `Bearer ${token}`);
    } else {
      headers.authorization = config.headers.authorization;
    }
    config.headers = headers;
    config.timeout = this.options.timeout;

    return new Promise((resolve, reject) => {
      wx.request({
        method: config.method,
        url: config.url,
        data: config.data,
        header: config.headers,
        complete: (res: any) => {
          const { code, message } = res.data;
          if (code !== 200) {
            this.options.onError && this.options.onError(code, message);
            return reject(JSON.stringify({ code, message, data: res.data.data }));
          }
          return resolve(res.data.data);
        }
      })
    })
  }
}
